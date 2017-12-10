if (!location.pathname.match(/.*\/[0-9]+\//)) {
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

    /*
     * Start point
     */
    (async function main() {
        for (let task of await fetch(`https://codein.withgoogle.com/api/program/2017/taskinstance/?is_active=True&my_tasks=false&order=-last_update_by_student&page=1&page_size=100`)) {
            if (task.last_update_by_student) {
                handleLastUpdateByStudent(task)
            } else {
                handleLastUpdateByMentor(task);
            }
        }
    }());

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
        return task.status === CLAIMED && taskDetails[0].kind === COMMENT;
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

    function differenceInHours(from, to = new Date()) {
        return Math.abs(new Date(from) - to) / 36e5;
    }

    /*
     * Colorize tasks
     */
    setInterval(() => {
        tasksToIgnore.forEach((task) => setStyle(task.id, {'opacity': '0.5'}));
        tasksHandled.forEach((task) => setStyle(task.id, {'color': '#9ccc00'}));
        tasksToHighlight.forEach((task) => setStyle(task.id, {'color': '#e53935'}));
        tasksRunningOutOfTime.forEach((task) => setStyle(task.id, {'color': '#2894ed'}));
    }, 2000);

    function setStyle(taskId, css) {
        $('a[href*="' + taskId + '"]').css(css);
    }
}
