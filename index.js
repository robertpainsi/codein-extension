const WAITING_FOR_REVIEW_IN_HOURS = 12;
const RUNNING_OUT_OF_TIME_IN_HOURS = 6;

const CLAIMED = 1;
const SUBMITTED = 4;

const ACTION = 1;
const COMMENT = 2;

const ALL = -1;

const tasksToIgnore = [];
const tasksHandled = [];
const tasksToHighlight = [];
const tasksRunningOutOfTime = [];

const taskStudentToHighlight = [];

let waitUntilUserIsOnInProgressTab = setInterval(() => {
    if (isOnInProgressSite()) {
        clearInterval(waitUntilUserIsOnInProgressTab);
        main();
    }
}, 200);

async function main() {
    for (let task of await fetch(`https://codein.withgoogle.com/api/program/2017/taskinstance/?is_active=True&my_tasks=false&order=-last_update_by_student&page=1&page_size=100`)) {
        handleStudentPreRequirements(task);
        if (task.last_update_by_student) {
            handleLastUpdateByStudent(task)
        } else {
            handleLastUpdateByMentor(task);
        }
    }
}

function handleStudentPreRequirements(task) {
    fetch(`https://codein.withgoogle.com/api/program/2017/taskinstance/?claimed_by=${task.claimed_by_id}&my_tasks=false&page=1&page_size=20`)
        .then((studentTasks) => {
            let highlightStudent = false;

            // TODO: Check for Students pre requirements and set highlightStudent = true; if necessary
            for (let studentTask of studentTasks) {
            }

            if (highlightStudent) {
                taskStudentToHighlight.push(task);
            }
        });
}

function handleLastUpdateByMentor(task) {
    if (isRunningOutOfTime(task)) {
        tasksRunningOutOfTime.push(task);
    } else {
        tasksHandled.push(task);
    }
}

function handleLastUpdateByStudent(task) {
    getLast10TaskDetails(task.id)
        .then((taskDetails) => {
            if (hasNoActivity(task, taskDetails)) {
                tasksToIgnore.push(task);
            } else if (isRunningOutOfTime(task)) {
                tasksRunningOutOfTime.push(task);
            } else if (isWaitingForComment(task, taskDetails)
                || isWaitingForReview(task, taskDetails)) {
                tasksToHighlight.push(task);
            }
        });
}

function hasNoActivity(task, taskDetails) {
    return task.status === CLAIMED && task.comments_count === 0 && taskDetails.length === 1;
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

const getLast10TaskDetails = (function() {
    const detailsCount = 10;
    const tasksCalls = new Map();
    return async function(taskId) {
        if (!tasksCalls.has(taskId)) {
            tasksCalls.set(taskId, fetch(`https://codein.withgoogle.com/api/program/current/taskupdate/?page=1&page_size=${detailsCount}&task_instance=` + taskId, detailsCount));
        }
        return tasksCalls.get(taskId);
    }
}());

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

/*
 * Colorize tasks
 */
setInterval(() => {
    if (isOnInProgressSite()) {
        tasksToIgnore.forEach((task) => setStyle(task.id, {'opacity': '0.5'}));
        tasksHandled.forEach((task) => setStyle(task.id, {'color': '#9ccc00'}));
        tasksToHighlight.forEach((task) => setStyle(task.id, {'color': '#e53935'}));
        tasksRunningOutOfTime.forEach((task) => setStyle(task.id, {'color': '#2894ed'}));

        taskStudentToHighlight.forEach((task) => setStudentStyle(task.claimed_by.display_name, {'color': '#e53935'}));
    }
}, 2000);

function setStyle(taskId, css) {
    $('a[href*="' + taskId + '"]').css(css);
}

function setStudentStyle(studentName, css) {
    $('td:contains("' + studentName + '")').css(css);
}
