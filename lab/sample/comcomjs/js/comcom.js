/*************************************************
 * ComComJS - Engine Core
 * Copyright (c) 2014,2015 Queue Sakura-Shiki
 * Released under the MIT license
 */

"use strict";

// Polyfills for AnimationFrame API
window.requestAnimationFrame = 
	/* window.requestAnimationFrame || 
	window.mozRequestAnimationFrame || 
	window.msRequestAnimationFrame || 
	window.webkitRequestAnimationFrame || */
	function(fn){ setTimeout(fn,1000/60); };


// ComComJS Engine Core

var COMCOM = {

	// Frame count after loading view.
	LOAD_END_TIME : 20,

	// cc-action functions
	actions : [],

	// cc-action functions
	outs : [],

	// Initialize engine.
	init : function(){

		// Set default CSS.
		var head = document.getElementsByTagName("head")[0];
		var style = document.createElement("style");
		style.textContent = 
			"html,body{"+
				"margin:0;"+
				"background-color:black;"+
				"overflow:hidden;"+
			"}"+
			"article{"+
				"display:none;"+
			"}"+
			".loading{"+
				"position:fixed;"+
				"background-color:black;"+
				"top:0%;"+
				"left:0%;"+
				"width:100%;"+
				"height:100%;"+
				"color:white;"+
			"}"+
			".loading>.proc{"+
				"position:absolute;"+
				"top:90%;"+
				"right:5%;"+
				"text-align:right;"+
			"}"+
			".loading>.proc>.percent{"+
				"margin-right:10px;"+
			"}"+
			".page{"+
				"display:none;"+
				"position:absolute;"+
				"top:0%;"+
				"left:0%;"+
				"height:100%;"+
				"width:100%;"+
			"}"+
			".splite{"+
				"position:absolute;"+
				"top:0%;"+
				"left:0%;"+
				"height:100%;"+
				"width:100%;"+
				"background-size:contain;"+
				"background-repeat:no-repeat;"+
				"background-position:center center;"+
			"}"+
			"";
		head.appendChild(style);

		document.addEventListener && document.addEventListener("DOMContentLoaded",
			function(){ COMCOM._delayInit(); },false
		);
	},

	// Initialize on DOMContentLoaded Event.
	_delayInit : function() {

		// Show loading view.
		var body = document.getElementsByTagName("body")[0];
		COMCOM.view = document.createElement("div");
		var loading = document.createElement("div");
		loading.setAttribute("class","loading");
		var proc = document.createElement("div");
		proc.setAttribute("class","proc");
		var percent = document.createElement("span");
		percent.setAttribute("class","percent");
		percent.textContent="Now Loading (0%)"
		proc.appendChild(percent);
		var loadImage = new Image();
		var loadingImageUrl = body.getAttribute("cc-load-icon");
		if( loadingImageUrl ) {
			loadImage.src=loadingImageUrl;
			loadImage.style.width="20px";
			proc.appendChild(loadImage);
		}
		loading.appendChild(proc);
		body.appendChild(COMCOM.view);
		body.appendChild(loading);

		// Show comics view.
		COMCOM._generate();

		// Load resources. (Actualy Images only.)
		var images = document.getElementsByTagName("img");
		var cnt = 0;
		for( var i=0; i<images.length; i++ ) {
			var image = new Image();
			image.src = images[i].getAttribute("src");
			image.onload= function(){
				cnt++;
				if( images.length === cnt ) {
					var opacity= COMCOM.LOAD_END_TIME;
					COMCOM._acceptInput();
					COMCOM._gotoNext();
					var fn = function(){
						if( opacity<0 ) {
							loading.style.display="none";
						} else {
							opacity --;
							loading.style.opacity=parseFloat(opacity/(COMCOM.LOAD_END_TIME*1.0));
							window.requestAnimationFrame(fn);
						}
					};
					fn();
				}
				percent.textContent="Now Loading ("+parseInt(100*cnt/images.length)+"%)";
			};
		}
	},

	// Generate DOMs to animate comics.
	_generate : function(){
		COMCOM.list = [];
		COMCOM.pageCount = 0;
		COMCOM.shownList = [];
		COMCOM.playing = false;
		var ps = document.getElementsByTagName("p");
		for( var i=0 ; i<ps.length ; i++ ) {
			var images = ps[i].getElementsByTagName("img");
			for( var j=0 ; j<images.length ; j++ ) {
				var page = document.createElement("div");
				page.setAttribute("class","page");
				COMCOM.view.appendChild(page);
				COMCOM.list.push(page);

				var splite = document.createElement("div");
				splite.setAttribute("class","splite");

				var style = images[j].getAttribute("cc-style");
				if( !style ) {
					style = "";
				}
				splite.setAttribute("style","background-image:url("+images[j].getAttribute("src")+");"+style);

				var action = images[j].getAttribute("cc-action");
				if( !action ) {
					action = "";
				}
				page.setAttribute("_action",action);

				var out = images[j].getAttribute("cc-out");
				if( !out ) {
					out = "";
				}
				page.setAttribute("_out",out);

				var add = images[j].getAttribute("cc-add");
				if( add !== null && add !== false ) {
					page.setAttribute("_add","true");
				}
				if( j !== images.length-1 ) {
					page.setAttribute("_doNext","true");
				}

				page.appendChild(splite);
			}
		}
	},

	// Begin acepting input. (like mouse and touch devices.)
	_acceptInput : function(){
		document.querySelector("body").addEventListener("click",function(){COMCOM._gotoNext()},true);
		document.querySelector("body").addEventListener("keydown",function(){ COMCOM._gotoNext();return false; },true);
	},

	// Move comics for a touch/click action.
	_gotoNext : function() {
		if( COMCOM.playing ) {
			return;
		}
		// Move a piece.
		var move = function() {
			if( COMCOM.pageCount < COMCOM.list.length ) {
				var next = COMCOM.list[COMCOM.pageCount];
				if( !next.getAttribute("_add") ) {
					for( var i=0 ; i<COMCOM.shownList.length ; i++ ) {
						var shownElem = COMCOM.shownList[i];
						var out = shownElem.getAttribute("_out");
						if( out ) {
							for( var key in COMCOM.outs ) {
								if( out === key ) {
									COMCOM.outs[key](shownElem,function(){
										shownElem.style.display = "none";
									});
								}
							}
						} else {
							shownElem.style.display = "none";
						}
					}
					COMCOM.shownList = [];					
				}
				var action = next.getAttribute("_action");
				if( action ) {
					for( var key in COMCOM.actions ) {
						if( action === key ) {
							COMCOM.playing=true;
							if( next.getAttribute("_doNext") ) {
								COMCOM.actions[key](next,function(){move();});
							} else {
								COMCOM.actions[key](next,function(){COMCOM.playing=false;});
							}
						}
					}
				} else {
					next.style.display="block";
					if( next.getAttribute("_doNext") ) {
						setTimeout(function(){move();},0);
					} else {
						COMCOM.playing=false;
					}
				}
				COMCOM.shownList.push(next);
			}
			COMCOM.pageCount++;
		};
		move();
	}
};


COMCOM.init();


