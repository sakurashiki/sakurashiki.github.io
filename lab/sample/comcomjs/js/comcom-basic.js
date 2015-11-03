/*************************************************
 * ComComJS - Basic action plugin.
 * Copyright (c) 2014,2015 Queue Sakura-Shiki
 * Released under the MIT license
 */

// for "cc-action"

COMCOM.actions["left"] = function(next,end){
	var ACTION_TIME = 30;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginLeft=(-(ACTION_TIME-time))+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["right"] = function(next,end){
	var ACTION_TIME = 30;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginLeft=(ACTION_TIME-time)+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["down"] = function(next,end){
	var ACTION_TIME = 30;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginTop=(-(ACTION_TIME-time))+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["up"] = function(next,end){
	var ACTION_TIME = 30;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginTop=(ACTION_TIME-time)+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["up-slowly"] = function(next,end){
	var ACTION_TIME = 60;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginTop=((ACTION_TIME-time)/100.0)+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["down-slowly"] = function(next,end){
	var ACTION_TIME = 60;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.marginTop=(-(ACTION_TIME-time)/100.0)+"%";
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["fade-in"] = function(next,end){
	var ACTION_TIME = 30;
	var time = 0;
	next.style.opacity=0.0;
	next.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			next.style.opacity=time/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};

COMCOM.actions["wait500"] = function(next,end){
	setTimeout(function(){
		next.style.display="block";
		end();
	},500);
};

COMCOM.actions["wave"] = function(next,end){
	var cnt = 0;
	next.style.display="block";
	var timer = setInterval(function(){
		cnt++;
		if( cnt%2 ) {
			next.style.marginTop="1.5%";
		} else {
			next.style.marginTop="-1.5%";
		}
		if( 15 <= cnt ) {
			next.style.marginTop="0%";
			clearInterval(timer);
			end();
		}
	},30);
};



// for "cc-out"

COMCOM.outs["fade-out"] = function(shownElem,end){
	var ACTION_TIME = 30;
	var time = 0;
	shownElem.style.opacity=1.0;
	shownElem.style.display="block";
	var fn = function(){
		time++;
		if( time <= ACTION_TIME ) {
			shownElem.style.opacity=(ACTION_TIME-time)/(ACTION_TIME*1.0);
			window.requestAnimationFrame(fn);
		} else {
			end();
		}
	};
	fn();
};


