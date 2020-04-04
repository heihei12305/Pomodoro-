const {ipcRenderer} = require('electron')
const Timer = require('timer.js')
const ProgressBar = require('progressbar.js/dist/progressbar.js')

const switchButton = document.getElementById('switch-button');
const progressBar = new ProgressBar.Circle('#timer-container', {
  strokeWidth: 2,
  color: '#F44336',
  trailColor: '#eee',
  trailWidth: 1,
  svgStyle: null
})

const workTime = 25 * 60; //25分钟工作
const restTime = 3 * 60; //3分钟休息
const longRestTime = 15 * 60; //15分钟长休息
let times = 0;
const state = {};

function render () {
  const {remainTime: s, type} = state;

  const maxTime = type < 2 ? workTime : restTime;
  const ss = s % 60;
  const mm = Math.floor(s / 60);
  progressBar.set(1 - s/maxTime);
  progressBar.setText(`${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`);
  if(type === 0) {
    switchButton.innerText = '开始工作';
  } else if(type === 1) {
    switchButton.innerText = '停止工作';
  } else if(type === 2) {
    switchButton.innerText = '开始休息';
  } else if(type === 3){
    switchButton.innerText = '停止休息';
  } else {
    switchButton.innerText = '开始长休息';
  }
}

function setState(_state) {
  Object.assign(state, _state);
  render();
}

function startWork() {
  setState({type: 1,remainTime: workTime});
  workTimer.start(workTime)
}

function startRest() {
  times ++;
  setState({type: 3,remainTime: restTime});
  workTimer.start(restTime)
}

function startLongRest() {
  setState({type: 4,remainTime: longRestTime});
  workTimer.start(restTime)
}

const workTimer = new Timer({
  ontick: (ms) => { setState({remainTime: (ms/1000).toFixed(0)}) }, //每秒更新时间
  onstop: () => { setState({type: 0, remainTime: 0})},
  onend: function() {
    let {type} = state;
    if(type === 1) {
      setState({type: 2, remainTime: 0});
      if(process.platform === 'darwin') {
        //开始长休息
        if(times >= 4) {
          times = 0;
          notification({
            title: '很累了吧！',
            body: '是否开始长休息？',
            actionText: '继续工作',
            closeButtonText: '休息15分钟',
            onaction: startWork,
            onclose: startLongRest
          })
        } else {
          
          notification({
            title: '恭喜你完成任务!',
            body: '是否开始休息？',
            actionText: '继续工作',
            closeButtonText: '休息三分钟',
            onaction: startWork,
            onclose: startRest
          })
        }
      } else { //windows直接alert
        alert('工作结束')
      }
    } else if(type === 3 || type === 4) {
      setState({type: 0, remainTime: 0});
      if(process.platform === 'darwin') {
        notification({
          title: '工作还在那等着呢！',
          body: '是否开始工作？',
          actionText: '继续休息',
          closeButtonText: '开始工作',
          onaction: startRest,
          onclose: startWork
        })
      } else {
        alert('工作开始')
      }
    }
  }
})


switchButton.onclick = function () {
  if(this.innerText === '开始工作') {
    startWork();
  } else if(this.innerText === '开始休息') {
    startRest();
  } else {
    workTimer.stop();
  }
}

/**
 *
 *
 * @param {*} {title, body, actionText, closeButtonText, onclose, onaction}
 */
async function notification({title, body, actionText, closeButtonText, onclose, onaction}) {
  let res = await ipcRenderer.invoke('work-notification',{
    title,
    body,
    actions:[{text: actionText, type: 'button'}],
    closeButtonText
  })
  res.event === 'close' ? onclose() : onaction();
}

setState({
  remainTime: 0,
  type: 0 // 0 开始工作,1 停止工作,2 开始休息,3 停止休息,4 开始长休息
})