var data = {};

// *******************************
// ExcelToJSON PARSING FILES START
// *******************************

let ExcelToJSON = function (variant) {
    this.parseExcel = function (file) {
        let reader = new FileReader();

        reader.onload = function (e) {
            let data = e.target.result;
            let workbook = XLSX.read(data, {
                type: 'binary'
            });
            workbook.SheetNames.forEach(function (sheetName) {
                // Here is your object
                let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                let json_object = JSON.stringify(XL_row_object);

                let filtered;

                if (variant === 'schedule') {
                    filtered = JSON.parse(json_object).filter((obj) => {
                        return obj.Position === 'Social Media Support Expert (secondary)';
                    });

                    window.data.scheduleObj = filtered;
                } else if (variant === 'answers') {
                    filtered = JSON.parse(json_object).filter((obj) => {
                        // return obj['Reply Status'] === 'Yes' && obj['Replied By'] === 'Customer Support';
                        return (
                            (obj['Task Assignee'] !== 'Den Kislinskiy' && obj['Replied By'] !== 'Den Kislinskiy') || obj['Task Assignee'] !== 'Den Kislinskiy' || obj['Replied By'] !== 'Den Kislinskiy'
                        );
                    });

                    window.data.answersObj = filtered;
                }
            });
        };

        reader.onerror = function (ex) {
            console.log(ex);
        };

        reader.readAsBinaryString(file);
    };
};

document.getElementById('upload-schedule').addEventListener(
    'change',
    (e) => {
        let files = e.target.files; // FileList object
        let xl2json = new ExcelToJSON('schedule');
        xl2json.parseExcel(files[0]);
        e.target.classList.add('uploaded');
    },
    false
);

document.getElementById('upload-answers').addEventListener(
    'change',
    (e) => {
        let files = e.target.files; // FileList object
        let xl2json = new ExcelToJSON('answers');
        xl2json.parseExcel(files[0]);
        e.target.classList.add('uploaded');
    },
    false
);

// *****************************
// ExcelToJSON PARSING FILES END
// *****************************

// *************************
// SHOW EMPLOYEES LIST START
// *************************

document.querySelector('.submit-button').addEventListener('click', (e) => {
    jQuery('.employees').empty();
    jQuery('.schedule').empty();

    e.preventDefault();

    if (!data.scheduleObj) {
        alert('Please put file with schedule');
        return;
    }

    if (!data.answersObj) {
        alert('Please put file with twitter answers');
        return;
    }

    showAllEmployees(data.scheduleObj);
});

function showAllEmployees(employees) {
    const list = document.createElement('ul');
    const container = document.querySelector('.employees');

    employees.forEach((element) => {
        list.appendChild(generateListItem(element));
    });

    container.appendChild(list);
}

function generateListItem(employee) {
    const listItem = document.createElement('li');
    const listItemButton = document.createElement('button');
    listItemButton.classList.add('employee-button');
    listItemButton.dataset.name = employee.Name;

    listItemButton.append(employee.Name);
    listItem.appendChild(listItemButton);

    return listItem;
}

// ***********************
// SHOW EMPLOYEES LIST END
// ***********************

// *****************************
// SHOW EMPLOYEES SCHEDULE START
// *****************************

jQuery('.employees').on('click', '.employee-button', (e) => {
    let selectedEmployee = e.target.dataset.name;
    let selectedSchedule = data.scheduleObj.filter((item) => {
        return item.Name === selectedEmployee;
    });

    showSelectedSchedule(selectedSchedule[0]);
});

function showSelectedSchedule(selectedEmployee) {
    let answersIdCounter = 0;
    // MONTH
    let slowestMonthAnswerId = 0;
    let fastestMonthAnswerId = 0;
    let averageMonthArr = [];
    let averageMonthTime = 0;
    let messagesProcessedMonth = 0;
    let employeesAnswersMonth = 0;
    // SHIFT
    let slowestShiftAnswerId = 0;
    let messagesProcessedShift = 0;
    let employeesAnswersShift = 0;

    const title = document.createElement('h2');
    const wrapper = document.createElement('div');
    const container = document.querySelector('.schedule');
    const infoContainer = document.createElement('div');

    var regExp = /[a-zA-Z]/g;

    infoContainer.classList.add('info-container');

    title.append(selectedEmployee.Name);

    let scheduleOnly = [...Object.keys(selectedEmployee)].filter((item) => {
        if (item !== 'Name' && item !== 'Org Unit' && item !== 'Position') {
            return (
                selectedEmployee[item].indexOf('Morning') !== -1 || // 8-16
                selectedEmployee[item].indexOf('08:00 - 16:00') !== -1 || // 8-16
                selectedEmployee[item].indexOf('Night') !== -1 || // 0-8
                selectedEmployee[item].indexOf('00:00 - 08:00') !== -1 || // 0-8
                selectedEmployee[item].indexOf('Evening') !== -1 || // 16-24
                selectedEmployee[item].indexOf('16:00 - 08:00') !== -1 // 16-24
            );
        }
    });

    scheduleOnly.forEach((item, indexShift) => {
        const title = document.createElement('b');
        title.append(item);

        const infoContainer = document.createElement('div');
        infoContainer.classList.add('info-container');

        const buttonShiftToggler = document.createElement('button');
        buttonShiftToggler.classList.add('shift-toggler', 'active');
        buttonShiftToggler.append('>');

        const scheduleDate = new Date(item).toLocaleDateString();

        messagesProcessedShift = data.answersObj.filter((elem) => {
            let completed;

            if (elem['Task Status'] === 'Tasked') {
                completed = elem['First Reply Timestamp'];
            } else {
                completed = elem['Completed Timestamp'];
            }

            if (!completed || regExp.test(completed)) {
                return false;
            }

            const completedArray = completed?.split(' ');
            const date = new Date(completedArray[0]).toLocaleDateString();
            const time = Number(completedArray[1]?.split(':')[0]);

            if (date && time) {
                if (scheduleDate === date && (selectedEmployee[item].indexOf('Morning') !== -1 || selectedEmployee[item].indexOf('08:00 - 16:00') !== -1) && time >= 8 && time < 16) {
                    return elem;
                }

                if (scheduleDate === date && (selectedEmployee[item].indexOf('Night') !== -1 || selectedEmployee[item].indexOf('00:00 - 08:00') !== -1) && time >= 0 && time < 8) {
                    return elem;
                }

                if (scheduleDate === date && (selectedEmployee[item].indexOf('Evening') !== -1 || selectedEmployee[item].indexOf('16:00 - 08:00') !== -1) && time >= 16 && time < 24) {
                    return elem;
                }
            }
        });

        employeesAnswersShift = data.answersObj.filter((elem) => {
            let completed;

            if (elem['Task Status'] === 'Tasked') {
                completed = elem['First Reply Timestamp'];
            } else {
                completed = elem['Completed Timestamp'];
            }

            if (!completed || regExp.test(completed)) {
                return false;
            }

            const completedArray = completed?.split(' ');
            const date = new Date(completedArray[0]).toLocaleDateString();
            const time = Number(completedArray[1]?.split(':')[0]);

            if (date && time) {
                if (scheduleDate === date && (selectedEmployee[item].indexOf('Morning') !== -1 || selectedEmployee[item].indexOf('08:00 - 16:00') !== -1) && time >= 8 && time < 16) {
                    return elem;
                }

                if (scheduleDate === date && (selectedEmployee[item].indexOf('Night') !== -1 || selectedEmployee[item].indexOf('00:00 - 08:00') !== -1) && time >= 0 && time < 8) {
                    return elem;
                }

                if (scheduleDate === date && (selectedEmployee[item].indexOf('Evening') !== -1 || selectedEmployee[item].indexOf('16:00 - 08:00') !== -1) && time >= 16 && time < 24) {
                    return elem;
                }
            }
        });

        const answersWrapper = document.createElement('div');
        answersWrapper.classList.add('answers-wrapper', 'active');

        let oneShiftAnswers = [];

        console.log(employeesAnswersShift, 'employeesAnswersShift');

        employeesAnswersShift.forEach((item, indexAnswer) => {
            const tweet = document.createElement('p');
            tweet.classList.add('tweet-wrapper');
            tweet.append(singleTweet(item, answersIdCounter, indexShift, indexAnswer));

            oneShiftAnswers.push({
                id: tweet.querySelector('.single-tweet').id,
                time: tweet.querySelector('.single-tweet').dataset.minutes
            });

            answersIdCounter++;

            answersWrapper.appendChild(tweet);
        });

        messagesProcessedMonth += messagesProcessedShift.length;
        employeesAnswersMonth += employeesAnswersShift.length;

        // количество обработаных сообщений
        // количество ответов
        // среднее время ответов
        // самый длинный ответ (с ссылкой в идеале)

        const div = document.createElement('div');
        div.classList.add('one-shift');
        const br = document.createElement('br');
        div.appendChild(title);

        let times = oneShiftAnswers.map((item) => Number(item.time));
        let averageShiftTime = Math.floor(times.reduce((a, b) => a + b, 0) / times.length);
        let slowestShiftAnswerTime = times.indexOf(Math.max.apply(null, times));
        slowestShiftAnswerId = oneShiftAnswers[slowestShiftAnswerTime]?.id;

        div.appendChild(infoElement(messagesProcessedShift.length, 'Messages processed quantity by shift: '));
        div.appendChild(infoElement(employeesAnswersShift.length, 'Answers quantity by shift: '));
        div.appendChild(infoElement(averageShiftTime, 'Average answers time by shift: '));
        div.appendChild(infoLinkElement(slowestShiftAnswerId, 'Slowest answer by shift: ', 'Slowest answer'));

        div.appendChild(buttonShiftToggler);
        div.appendChild(br);
        div.append(selectedEmployee[item]);

        div.appendChild(answersWrapper);

        if (employeesAnswersShift.length > 0) {
            wrapper.appendChild(div);
        }
        // wrapper.appendChild(div);
    });

    container.innerHTML = '';

    // количество обработаных сообщений
    // количество ответов
    // среднее время ответов
    // самый длинный ответ (с ссылкой в идеале)
    // самый быстрый ответ

    averageMonthTime = Math.floor(averageMonthArr.reduce((a, b) => a + b, 0) / averageMonthArr.length);
    slowestMonthAnswerId = averageMonthArr.indexOf(Math.max(...averageMonthArr));
    fastestMonthAnswerId = averageMonthArr.indexOf(Math.min(...averageMonthArr));

    infoContainer.appendChild(infoElement(messagesProcessedMonth, 'Messages processed quantity by month: '));
    infoContainer.appendChild(infoElement(employeesAnswersMonth, 'Answers quantity by month: '));
    infoContainer.appendChild(infoElement(averageMonthTime, 'Average answers time by month: '));
    infoContainer.appendChild(infoLinkElement(slowestMonthAnswerId, 'Slowest answer by month: ', 'Slowest answer'));
    infoContainer.appendChild(infoLinkElement(fastestMonthAnswerId, 'Fastest answer by month: ', 'Fastest answer'));

    if (!messagesProcessedMonth && !employeesAnswersMonth) {
        scheduleOnly = [];
    }

    if (scheduleOnly.length) {
        container.appendChild(title);
        container.appendChild(infoContainer);
        container.appendChild(wrapper);
    } else {
        title.innerHTML = 'No shifts';
        container.appendChild(title);
    }

    function singleTweet(tweet, answersIdCounter, indexShift, indexAnswer) {
        const wrapper = document.createElement('div');
        wrapper.id = answersIdCounter;
        wrapper.dataset.indexShift = indexShift;
        wrapper.dataset.indexAnswer = indexAnswer;
        wrapper.classList.add('single-tweet');

        let completedTimeStamp;

        if (tweet['Task Status'] === 'Tasked') {
            completedTimeStamp = tweet['First Reply Timestamp'];
        } else {
            completedTimeStamp = tweet['Completed Timestamp'];
        }

        const br = document.createElement('br');

        const completed = document.createElement('span');
        completed.append(completedTimeStamp);
        const submitted = document.createElement('span');
        submitted.append(tweet['Timestamp (PT)']);

        const timeStamps = document.createElement('p');
        timeStamps.append(tweet['Timestamp (PT)'] + ' - ' + completedTimeStamp);

        const family = document.createElement('span');
        family.classList.add('family');

        if (tweet['Connected Profile']) {
            if (tweet['Connected Profile'].toLowerCase() === 'spaceship') {
                family.append('S');
                family.setAttribute('title', 'Spaceship');
            } else {
                family.append('N');
                family.setAttribute('title', 'Namecheap');
            }
        } else {
            family.append('N');
            family.setAttribute('title', 'Namecheap');
        }

        const submittedTime = new Date(tweet['Timestamp (PT)']);
        const completedTime = new Date(completedTimeStamp);
        const diff = Math.abs(completedTime - submittedTime);

        const minutes = Math.floor(diff / 1000 / 60);

        wrapper.dataset.minutes = minutes;
        averageMonthArr.push(minutes);

        const processingTime = document.createElement('p');
        processingTime.append(minutes + ' minutes processing');

        const select = document.createElement('select');
        const options = ['checked', 'recommendation', 'mistake', 'critical mistake'];
        options.forEach((option) => {
            const newOption = document.createElement('option');
            newOption.append(option);

            select.appendChild(newOption);
        });

        const textArea = document.createElement('textarea');

        const nativeLink = document.createElement('a');
        nativeLink.href = tweet['Native Permalink'];
        nativeLink.setAttribute('target', '_blank');
        nativeLink.append('Client message');

        const permaLink = document.createElement('a');
        permaLink.href = tweet['Permalink'];
        permaLink.setAttribute('target', '_blank');
        permaLink.append('Our reply');

        const nativeLinkHolder = document.createElement('p');
        nativeLinkHolder.appendChild(nativeLink);

        const permaLinkHolder = document.createElement('p');
        permaLinkHolder.appendChild(permaLink);

        wrapper.appendChild(timeStamps);
        wrapper.appendChild(family);

        if (tweet['Task Status'] !== 'Tasked') {
            wrapper.appendChild(processingTime);
        } else {
            processingTime.innerHTML = 'Tasked';
            wrapper.appendChild(processingTime);
        }

        if (tweet['Message']) {
            const message = document.createElement('p');
            message.append(tweet['Message']);

            wrapper.appendChild(message);
        }

        wrapper.appendChild(nativeLinkHolder);
        wrapper.appendChild(permaLinkHolder);
        wrapper.appendChild(select);
        wrapper.appendChild(br);
        wrapper.appendChild(textArea);

        return wrapper;
    }
}

function infoElement(elem, text) {
    const p = document.createElement('p');
    p.innerHTML = text;
    p.append(elem);
    return p;
}

function infoLinkElement(elem, text, linkText) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.classList.add('link');
    a.href = '#' + elem;
    a.innerText = linkText;
    p.append(text);
    p.appendChild(a);
    return p;
}

// ***************************
// SHOW EMPLOYEES SCHEDULE END
// ***************************

// ********************
// TOGGLER BUTTON START
// ********************

jQuery('.schedule').on('click', '.shift-toggler', (e) => {
    const closestAnswers = jQuery(e.target).siblings('.answers-wrapper');
    if (!closestAnswers.hasClass('active')) {
        closestAnswers.addClass('active');
        e.target.classList.add('active');
    } else {
        closestAnswers.removeClass('active');
        e.target.classList.remove('active');
    }
});

// ******************
// TOGGLER BUTTON END
// ******************
