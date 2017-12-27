const WAITING_FOR_REVIEW_IN_HOURS = 12;
const RUNNING_OUT_OF_TIME_IN_HOURS = 6;

const CLAIMED = 1;
const SUBMITTED = 4;
const WAITING_FOR_GOOGLE_REVIEW_OF_PARENTAL_CONSENT = 8;

const ACTION = 1;
const COMMENT = 2;

const ALL = -1;

let cache = {};

const tasksToIgnore = [];
const tasksHandled = [];
const tasksToHighlight = [];
const tasksRunningOutOfTime = [];

let waitUntilUserIsOnInProgressTab = setInterval(() => {
    if (isOnInProgressSite()) {
        clearInterval(waitUntilUserIsOnInProgressTab);
        main();
    }
}, 200);

async function main() {
    const taskPromises = [];
    await loadCache(await fetch(`https://codein.withgoogle.com/api/program/2017/taskinstance/?is_active=True&my_tasks=false&order=-last_update_by_student&page=1&page_size=100`));
    for (let {task} of Object.values(cache)) {
        if (task.status === WAITING_FOR_GOOGLE_REVIEW_OF_PARENTAL_CONSENT
            || task.comments_count === 0) {
            tasksToIgnore.push(task);
        } else if (task.last_update_by_student) {
            taskPromises.push(handleLastUpdateByStudent(task));
        } else {
            taskPromises.push(handleLastUpdateByMentor(task));
        }
    }
    Promise.all(taskPromises).then(saveCache);
}

async function handleLastUpdateByMentor(task) {
    if (isRunningOutOfTime(task)) {
        tasksRunningOutOfTime.push(task);
    } else {
        tasksHandled.push(task);
    }
}

async function handleLastUpdateByStudent(task) {
    const taskDetails = await getLast10TaskDetails(task.id);
    if (isRunningOutOfTime(task)) {
        tasksRunningOutOfTime.push(task);
    } else if (isWaitingForComment(task, taskDetails) || isWaitingForReview(task, taskDetails)) {
        tasksToHighlight.push(task);
    }
}

function isWaitingForComment(task, taskDetails) {
    return task.last_update_by_student && taskDetails[0].kind === COMMENT;
}

function isRunningOutOfTime(task) {
    return !task.deadline_paused && differenceInHours(task.deadline_to_complete) < RUNNING_OUT_OF_TIME_IN_HOURS;
}

function isWaitingForReview(task, taskDetails) {
    if (task.status === SUBMITTED) {
        for (let task_detail of taskDetails) {
            if (task_detail.old_task_instance_status !== SUBMITTED && task_detail.new_task_instance_status === SUBMITTED) {
                return differenceInHours(task_detail.created) >= WAITING_FOR_REVIEW_IN_HOURS;
            }
        }
    }
    return false;
}

async function getLast10TaskDetails(taskId) {
    if (cache[taskId].taskDetails) {
        return cache[taskId].taskDetails;
    } else {
        const taskDetailsCount = 10;
        const taskDetails = await fetch(`https://codein.withgoogle.com/api/program/current/taskupdate/?page=1&page_size=${taskDetailsCount}&task_instance=${taskId}`, taskDetailsCount);
        cache[taskId].taskDetails = taskDetails;
        return taskDetails;
    }
}

/*
 * Utils methods
 */
async function fetch(url, count = ALL) {
    const items = [];
    while (true) {
        const {results, next} = await $.getJSON(url);
        items.push(...results);
        if (next && (count === ALL || items.length < count)) {
            url = next;
        } else {
            break;
        }
    }
    return (count > 0) ? items.slice(0, count) : items;
}

function isOnInProgressSite() {
    return location.pathname.match(/dashboard\/task-instances\/in-progress/);
}

function differenceInHours(from, to = new Date()) {
    return Math.abs(new Date(from) - to) / 36e5;
}

function findTaskWithId(tasks, id) {
    for (let task of tasks) {
        if (task.id === id) {
            return task;
        }
    }
    return null;
}

function hasChromeLocalStorage() {
    return !!window.chrome && window.chrome.storage && window.chrome.storage.local;
}

/*
 * Caching
 */
function loadCache(tasks) {
    return new Promise(function(resolve, reject) {
        if (hasChromeLocalStorage()) {
            chrome.storage.local.get(null, function(cachedEntries) {
                for (let task of tasks) {
                    const cachedTask = (cachedEntries[task.id] || {}).task;
                    if (cachedTask
                        && cachedTask.modified === task.modified
                        && cachedTask.status === task.status
                        && cachedTask.comments_count === task.comments_count
                    ) {
                        cache[task.id] = cachedEntries[task.id];
                    } else {
                        cache[task.id] = {task};
                    }
                }
                resolve();
            });
        } else {
            for (let task of tasks) {
                cache[task.id] = {task};
            }
            resolve();
        }
    });
}

function saveCache() {
    return new Promise(function(resolve, reject) {
        if (hasChromeLocalStorage()) {
            chrome.storage.local.clear();
            chrome.storage.local.set(cache);
            resolve();
        } else {
            resolve();
        }
    });
}

/*
 * Colorize tasks
 */
setInterval(() => {
    if (isOnInProgressSite()) {
        tasksToIgnore.forEach((task) => setStyle(task.id, {'opacity': '0.5'}));
        tasksHandled.forEach((task) => setStyle(task.id, {'color': '#9ccc00'}));
        tasksToHighlight.forEach((task) => setStyle(task.id, {'color': '#e53935'}));
        tasksRunningOutOfTime.forEach((task) => setStyle(task.id, {'color': '#2894ed'}));
    }
}, 2000);

function setStyle(taskId, css) {
    $('a[href*="' + taskId + '"]').css(css);
}
