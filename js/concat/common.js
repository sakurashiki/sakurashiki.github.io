(function() {
  var PAGE_DELAY, after, before, convertParams, delayInit, fadeOut, frameCount, getSpeedElement, goBackToLastSection, gotoNextSection, gotoTargetId, init, isMobile, isWorking, maxPageCount, moveFrame, moveProgressView, nextFrame, pageCount, pageFrameCount, popEvent, sections, setCSS, setDefaultCSS, showFirstSection, showLoadView, spaPush, speedElems, switchPage, switchVideoState;

  PAGE_DELAY = 60;

  nextFrame = function(fn) {
    return setTimeout(fn, 1000 / 60);
  };

  isMobile = (navigator.userAgent.indexOf('iPhone') > 0 && navigator.userAgent.indexOf('iPad') === -1) || navigator.userAgent.indexOf('iPod') > 0 || navigator.userAgent.indexOf('Android') > 0;

  isWorking = false;

  spaPush = false;

  frameCount = 0;

  pageFrameCount = 0;

  speedElems = [];

  sections = [];

  pageCount = 0;

  maxPageCount = 0;

  after = null;

  before = null;

  window.LEAPING = {
    actions: {},
    PAGE_CHANGE_TIME: PAGE_DELAY
  };

  setDefaultCSS = function() {
    var style;
    style = document.createElement("style");
    style.textContent = "html,body {\n	margin : 0;\n	padding : 0;\n	background-color : black;\n	color : white;\n	overflow : hidden;\n	width : 100%;\n	height: 100%;\n}\nhtml {\n	touch-action : none;\n}\nsection {\n	display : none;\n	position : fixed;\n	top : 0%;\n	left : 0%;\n	width : 100%;\n	height : 100%;\n	background-repeat : no-repeat;\n	background-position : center center;\n	background-size : cover;\n	text-align : center;\n}\n.lpBlock {\n	position : fixed;\n	dipslay : block;\n	width : 100%;\n	left : 0%;\n	top : 0%;\n	text-align : center;\n	margin : 0;\n	padding : 0;\n}\n.nowloading {\n	display : block;\n	position : fixed;\n	top : 0%;\n	left : 0%;\n	width : 100%;\n	height : 100%;\n	background-color: black;\n}\n.nowloading>.progress {\n	position : absolute;\n	bottom : 2%;\n	right : 2%;\n	width :100%;\n	text-align : right;\n}\n.nowloading>.progress>.logo {\n	display : inline-block;\n	width : 16px;\n	height : 16px;\n}";
    (document.querySelector("head")).appendChild(style);
  };

  showLoadView = function() {
    var nowLoading;
    nowLoading = document.createElement("div");
    nowLoading.setAttribute("class", "nowloading");
    nowLoading.innerHTML = "<div class='progress'>Now Loading (<span class='percent'>0</span>%)</div>";
    (document.querySelector("body")).appendChild(nowLoading);
  };

  moveProgressView = function() {
    var allElems, bg, cnt, elem, image, imageList, images, img, loadView, percent, url, _i, _j, _k, _len, _len1, _len2;
    images = document.querySelectorAll("img");
    loadView = document.querySelector(".nowloading");
    percent = loadView.querySelector(".percent");
    imageList = [];
    allElems = document.getElementsByTagName("*");
    for (_i = 0, _len = images.length; _i < _len; _i++) {
      image = images[_i];
      imageList.push(image.getAttribute("src"));
    }
    for (_j = 0, _len1 = allElems.length; _j < _len1; _j++) {
      elem = allElems[_j];
      convertParams(elem);
      bg = elem.getAttribute("lp-bg");
      if (bg) {
        imageList.push(bg);
      }
    }
    cnt = 0;
    for (_k = 0, _len2 = imageList.length; _k < _len2; _k++) {
      url = imageList[_k];
      img = document.createElement("img");
      img.onload = function() {
        cnt++;
        percent.textContent = parseInt((cnt * 100) / imageList.length);
        if (imageList.length <= cnt) {
          fadeOut(loadView);
          return showFirstSection();
        }
      };
      img.onerror = function() {
        return alert("Can't load resource -> " + url);
      };
      img.src = url;
    }
  };

  fadeOut = function(elem) {
    var beginFrame, maxFrame, timer, work;
    beginFrame = 0;
    maxFrame = 120.0;
    work = function() {
      beginFrame++;
      if (maxFrame < beginFrame) {
        clearInterval(timer);
        elem.style.opacity = 0.0;
        return elem.style.display = "none";
      } else {
        return elem.style.opacity = (maxFrame - beginFrame) / maxFrame;
      }
    };
    timer = setInterval(work, 1000 / 60);
  };

  convertParams = function(elem) {
    var bg, classStr, lst, touch, x, y;
    classStr = elem.getAttribute("class");
    if (!classStr) {
      classStr = "";
    }
    bg = elem.getAttribute("lp-bg");
    if (bg) {
      elem.style.backgroundImage = "url(" + bg + ")";
    }
    x = elem.getAttribute("lp-x");
    if (x) {
      elem.setAttribute("class", classStr + " lpBlock");
      elem.style.left = x + "%";
    }
    y = elem.getAttribute("lp-y");
    if (y) {
      elem.setAttribute("class", classStr + " lpBlock");
      elem.style.top = y + "%";
    }
    if (elem.getAttribute("lp-speed")) {
      elem.setAttribute("lp-text", elem.textContent);
    }
    touch = elem.getAttribute("lp-touch");
    if (touch) {
      if (touch === "next") {
        elem.addEventListener("click", gotoNextSection);
      } else if (touch === "back") {
        elem.addEventListener("click", goBackToLastSection);
      } else {
        lst = touch.split(":");
        if (lst[0] === "goto") {
          elem.addEventListener("click", gotoTargetId);
        }
      }
    }
  };

  moveFrame = function() {
    var action, count, currentFrame, elem, maxTime, _i, _len;
    frameCount++;
    pageFrameCount++;
    for (_i = 0, _len = speedElems.length; _i < _len; _i++) {
      elem = speedElems[_i];
      count = (pageFrameCount - PAGE_DELAY) * parseInt(elem.getAttribute("lp-speed")) * 0.02;
      elem.textContent = (elem.getAttribute("lp-text")).substring(0, count);
    }
    if (pageFrameCount <= PAGE_DELAY) {
      isWorking = true;
      action = null;
      action = after.getAttribute("lp-action");
      if (action) {
        if (window.LEAPING.actions[action]) {
          window.LEAPING.actions[action](before, after, pageFrameCount);
        } else {
          before.style.opacity = 1.0;
          before.style.display = "none";
          after.style.opacity = 1.0;
          after.style.display = "block";
          pageFrameCount = PAGE_DELAY;
        }
      } else {
        if (pageFrameCount < PAGE_DELAY / 2) {
          maxTime = PAGE_DELAY / 2;
          before.style.transform = "scale(" + (2.0 + Math.cos(Math.PI / (1.0 + (pageFrameCount / maxTime)))) + ")";
          before.style.opacity = (maxTime - pageFrameCount) / (maxTime * 1.0);
        } else {
          if (before) {
            before.style.display = "none";
          }
          maxTime = PAGE_DELAY / 2;
          currentFrame = pageFrameCount - maxTime;
          after.style.display = "block";
          after.style.transform = "scale(" + (Math.sin(Math.PI / (1.0 + (currentFrame / maxTime)))) + ")";
          after.style.opacity = 1.0 - ((maxTime - currentFrame) / (maxTime * 1.0));
        }
      }
    } else {
      isWorking = false;
    }
    nextFrame(moveFrame);
  };

  getSpeedElement = function(elem) {
    var d, elems, list, speed, _i, _len;
    list = [];
    elems = elem.getElementsByTagName("*");
    for (_i = 0, _len = elems.length; _i < _len; _i++) {
      d = elems[_i];
      speed = d.getAttribute("lp-speed");
      if (speed) {
        list.push(d);
      }
    }
    return list;
  };

  switchVideoState = function() {
    var video;
    if (isMobile) {
      return;
    }
    if (before) {
      video = before.querySelector("video");
      if (video) {
        video.pause();
      }
    }
    if (after) {
      video = after.querySelector("video");
      if (video) {
        video.play();
      }
    }
  };

  showFirstSection = function() {
    pageFrameCount = PAGE_DELAY / 2;
    pageCount = 0;
    sections = document.querySelectorAll("section");
    maxPageCount = sections.length;
    after = sections[pageCount];
    speedElems = getSpeedElement(after);
    after.style.display = "block";
    moveFrame();
    switchVideoState();
    if (spaPush && afterId) {
      history.pushState({
        id: afterId
      }, null, "#" + afterId);
    }
  };

  gotoNextSection = function() {
    var afterId;
    if (isWorking) {
      return;
    }
    pageFrameCount = 0;
    before = sections[pageCount];
    pageCount++;
    if (maxPageCount <= pageCount) {
      pageCount = 0;
    }
    after = sections[pageCount];
    speedElems = getSpeedElement(after);
    switchVideoState();
    afterId = after.getAttribute("id");
  };

  goBackToLastSection = function() {
    if (isWorking) {
      return;
    }
    pageFrameCount = 0;
    before = sections[pageCount];
    pageCount--;
    if (pageCount < 0) {
      pageCount = maxPageCount - 1;
    }
    after = sections[pageCount];
    speedElems = getSpeedElement(after);
    switchVideoState();
  };

  gotoTargetId = function() {
    var afterId, lst;
    if (isWorking) {
      return;
    }
    lst = (this.getAttribute("lp-touch")).split(":");
    afterId = lst[1];
    switchPage(afterId);
    if (spaPush) {
      history.pushState({
        id: afterId
      }, null, "#" + afterId);
    }
  };

  switchPage = function(afterId) {
    before = after;
    after = document.querySelector("#" + afterId);
    pageFrameCount = 0;
    speedElems = getSpeedElement(after);
    switchVideoState();
  };

  setCSS = function(elems, styleName, value) {
    var elem, _i, _len;
    for (_i = 0, _len = elems.length; _i < _len; _i++) {
      elem = elems[_i];
      elem.style[styleName] = value;
    }
  };

  delayInit = function() {
    if (document.querySelector("body").getAttribute("lp-push") && window.history.pushState) {
      spaPush = true;
      window.addEventListener('popstate', popEvent);
    }
    showLoadView();
    moveProgressView();
  };

  popEvent = function(evt) {
    var state;
    state = evt.state;
    if (state.id) {
      switchPage(state.id);
    }
  };

  init = function() {
    setDefaultCSS();
  };

  init();

  document.addEventListener("DOMContentLoaded", delayInit);

}).call(this);
