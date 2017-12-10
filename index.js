if (!location.pathname.match(/.*\/[0-9]+\//)) {
    const WAITING_FOR_REVIEW_IN_HOURS = 12;
    const RUNNING_OUT_OF_TIME_IN_HOURS = 6;

    const CLAIMED = 1;
    const SUBMITTED = 4;

    const ACTION = 1;
    const COMMENT = 2;

    const tasksToIgnore = [];
    const tasksHandled = [];
    const tasksToHighlight = [];
    const tasksRunningOutOfTime = [];

    (async function() {
        for (let task of await getAllTasks()) {
            if (task.last_update_by_student) {
                handleLastUpdateByStudent(task)
            } else {
                handleLastUpdateByMentor(task);
            }
        }
    }());

    async function getAllTasks() {
        const tasks = [];
        let page = 1;
        while (true) {
            const data = await $.getJSON(`https://codein.withgoogle.com/api/program/2017/taskinstance/?is_active=True&my_tasks=false&order=-last_update_by_student&page=${page}&page_size=100`);
            tasks.push(...data.results);
            page++;
            if (!data.next) {
                break;
            }
        }
        return tasks;
    }

    function handleLastUpdateByMentor(task) {
        if (isRunningOutOfTime(task)) {
            tasksRunningOutOfTime.push(task);
        } else {
            tasksHandled.push(task);
        }
    }

    function handleLastUpdateByStudent(task) {
        $.getJSON('https://codein.withgoogle.com/api/program/current/taskupdate/?page=1&page_size=10&task_instance=' + task.id)
            .then(({results: taskDetails}) => {
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

    /*
     * Utils methods
     */
    function differenceInHours(from, to = new Date()) {
        return Math.abs(new Date(from) - to) / 36e5;
    }

    /*
     * Colorize tasks
     */
    setInterval(() => {
        tasksToIgnore.forEach((task) => $('a[href*="' + task.id + '"]').addClass('codein-extension-task-ignore'));
        tasksHandled.forEach((task) => $('a[href*="' + task.id + '"]').addClass('codein-extension-task-handled'));
        tasksToHighlight.forEach((task) => $('a[href*="' + task.id + '"]').addClass('codein-extension-task-highlighted'));
        tasksRunningOutOfTime.forEach((task) => $('a[href*="' + task.id + '"]').addClass('codein-extension-task-running-out-of-time'));
    }, 2000);
}
