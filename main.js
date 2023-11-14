var data = {};


let ExcelToJSON = function(variant) {
  this.parseExcel = function(file) {
    let reader = new FileReader();

    reader.onload = function(e) {
      let data = e.target.result;
      let workbook = XLSX.read(data, {
        type: 'binary'
      });
      workbook.SheetNames.forEach(function(sheetName) {
        // Here is your object
        let XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        let json_object = JSON.stringify(XL_row_object);

        let filtered;

        if (variant === 'schedule') {
          filtered = JSON.parse(json_object).filter((obj) => {
            return obj.Position === "Social Media Support Expert (secondary)";
          });

          // console.log("Schedule: ", filtered);

          window.data.scheduleObj = filtered;
        } else if (variant === 'answers') {
          filtered = JSON.parse(json_object).filter((obj) => {
            return obj["Task Assignee"] !== "Den Kislinskiy";
          })

          // console.log("Answers: ", filtered);

          window.data.answersObj = filtered;
        }
      })
    };

    reader.onerror = function(ex) {
      console.log(ex);
    };

    reader.readAsBinaryString(file);
  };
};


document.getElementById('upload-schedule').addEventListener('change', e => {
  let files = e.target.files; // FileList object
  let xl2json = new ExcelToJSON('schedule');
  xl2json.parseExcel(files[0]);
  e.target.classList.add('uploaded');
}, false);


document.getElementById('upload-answers').addEventListener('change', e => {
  let files = e.target.files; // FileList object
  let xl2json = new ExcelToJSON('answers');
  xl2json.parseExcel(files[0]);
  e.target.classList.add('uploaded');
}, false);


// *************************
// SHOW EMPLOYEES LIST START
// *************************
document.querySelector('.submit-button').addEventListener('click', e => {
  e.preventDefault();

  if (!data.scheduleObj) {
    alert("Please put file with schedule");
    return;
  }

  if (!data.answersObj) {
    alert("Please put file with twitter answers");
    return;
  }

  showAllEmployees(data.scheduleObj);
});


function showAllEmployees(employees) {
  const list = document.createElement('ul');
  const container = document.querySelector('.employees');

  employees.forEach(element => {
    list.appendChild(generateListItem(element));
  });

  container.appendChild(list);
}


function generateListItem(employee) {
  const listItem = document.createElement('li');
  const listItemButton = document.createElement('button');
  listItemButton.classList.add('employee-button');
  listItemButton.dataset.name = employee.Name

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
jQuery('.employees').on('click', '.employee-button', e => {
  let selectedEmployee = e.target.dataset.name;
  let selectedSchedule = data.scheduleObj.filter(item => {
    return item.Name === selectedEmployee;
  })

  showSelectedSchedule(selectedSchedule[0]);
});


function showSelectedSchedule(selectedEmployee) {
  const title = document.createElement('h2');
  const wrapper = document.createElement('div');
  const container = document.querySelector('.schedule');

  title.append(selectedEmployee.Name);

  let scheduleOnly = [...Object.keys(selectedEmployee)].filter(item => {
    if (item !== 'Name' && item !== 'Org Unit' && item !=='Position') {
      return (
        selectedEmployee[item].indexOf("Morning") !== -1 ||  // 8-16
        selectedEmployee[item].indexOf("Night") !== -1 ||  // 0-8
        selectedEmployee[item].indexOf("Evening") !== -1  // 16-24
      );
    }
  });

  scheduleOnly.forEach(item => {
    const title = document.createElement('b');
    title.append(item);

    const buttonShiftToggler = document.createElement('button');
    buttonShiftToggler.classList.add('shift-toggler');
    buttonShiftToggler.append('>');

    const div = document.createElement('div');
    div.classList.add('one-shift');
    const br = document.createElement('br');
    div.appendChild(title);
    div.appendChild(buttonShiftToggler);
    div.appendChild(br);
    div.append(selectedEmployee[item]);

    const scheduleDate = new Date(item).toLocaleDateString();

    const employeesAnswers = data.answersObj.filter(elem => {
      const completed = elem['Completed Timestamp'].split(" ");
      const date = new Date(completed[0]).toLocaleDateString();
      const time = Number(completed[1].split(":")[0]);

      if (scheduleDate === date && selectedEmployee[item].indexOf("Morning") !== -1 && time >= 8 && time < 16) {
        return elem;
      }

      if (scheduleDate === date && selectedEmployee[item].indexOf("Night") !== -1 && time >= 0 && time < 8) {
        return elem;
      }

      if (scheduleDate === date && selectedEmployee[item].indexOf("Evening") !== -1 && time >= 16 && time < 24) {
        return elem;
      }
    })

    const answersWrapper = document.createElement('div');
    answersWrapper.classList.add('answers-wrapper');

    employeesAnswers.forEach(item => {
      const tweet = document.createElement('p');
      tweet.classList.add('tweet-wrapper');
      tweet.append(singleTweet(item));

      answersWrapper.appendChild(tweet);
    })

    div.appendChild(answersWrapper);

    wrapper.appendChild(div);
  });

  container.innerHTML = '';

  if (scheduleOnly.length) {
    container.appendChild(title);
    container.appendChild(wrapper);
  } else {
    title.innerHTML = 'No shifts';
    container.appendChild(title);
  }
}


function singleTweet(tweet) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('single-tweet');

  const br = document.createElement('br');

  const completed = document.createElement('span');
  completed.append(tweet['Completed Timestamp'])
  const submitted = document.createElement('span');
  submitted.append(tweet['Timestamp (PT)']);

  const timeStamps = document.createElement('p');
  timeStamps.append(tweet['Timestamp (PT)'] + " - " + tweet['Completed Timestamp']);

  const submittedTime = new Date(tweet['Timestamp (PT)']);
  const completedTime = new Date(tweet['Completed Timestamp']);
  const diff = Math.abs(completedTime - submittedTime);
  const minutes = Math.floor((diff/1000)/60);

  const processingTime = document.createElement('p');
  processingTime.append(minutes + ' minutes processing');

  const select = document.createElement('select');
  const options = [
    'checked',
    'recommendation',
    'mistake',
    'critical mistake'
  ]
  options.forEach(option => {
    const newOption = document.createElement('option');
    newOption.append(option);

    select.appendChild(newOption);
  })

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
  wrapper.appendChild(processingTime);

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
// ***************************
// SHOW EMPLOYEES SCHEDULE END
// ***************************

jQuery('.schedule').on('click', '.shift-toggler', e => {
  const closestAnswers = jQuery(e.target).siblings('.answers-wrapper');
  console.log(closestAnswers);
  if (!closestAnswers.hasClass('active')) {
    closestAnswers.addClass('active');
    e.target.classList.add('active');
  } else {
    closestAnswers.removeClass('active');
    e.target.classList.remove('active');
  }
});