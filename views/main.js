var num_objects=9; //default value, number of objects
var h=20; //hardnessmain9.css
var cnt=0; //stage count
var score_sum=0; //calculate score
var score_inc=0;

var gener_color; //generated color
var trans_color; //transformed color
var objects; //import whole objects from HTML file
var diff = 0;
var diff_prev=0;//set position where trans_color locate
var intv; //interval

var stat_stage = document.querySelector("#stage");
var stat_time = document.querySelector("#tbar");
//var span_diff_pos = document.querySelector("#diff_pos");
var reset = document.querySelector("#reset");
//var span_gen_color = document.querySelector("#gen_color");
//var span_trs_color = document.querySelector("#trs_color");

overlay_off();
add_object(9);
initialize();

/*relate to UI,UX*/

//functions for overlay transition (on,off)
function overlay_on(){
    document.getElementById("overlay_on").style.display = "block";
}

function overlay_off(){
    document.getElementById("overlay_off").style.display = "block";
    setTimeout('document.getElementById("overlay_off").style.display = "none"', 500)
}

//progress bar (timer)
function timebar(){ 
	clearInterval(intv);
	var width = 100;
	intv = setInterval(trans, 10);
	function trans(){
		if (width <= 0){
			stat_time.innerHTML = "END!";
		    clearInterval(intv);
			end();		    
	    }else{    
		    width-=0.1;
			stat_time.style.width = width+'%';		
			stat_time.innerHTML = (width/10).toFixed(1)+'&nbsp';
	    }
	}
}

//add multiple objects, n is number of objects
function add_object(n){
	for (var i=1; i<n; i++){
		var div = document.createElement('div');
    	div.innerHTML = document.getElementById('init').innerHTML;
    	document.getElementById('append').appendChild(div);
	}
    objects = document.querySelectorAll("#object");
}

//create random value of R,G,B separately and combine to RGB color code
function rand_color(n){
	diff = Math.floor(Math.random() * n);

	if (diff_prev == diff){
		diff = Math.floor(Math.random() * n);
	}
	diff_prev == diff;
	var r = Math.floor(Math.random() * 256);
	var g = Math.floor(Math.random() * 256);
	var b = Math.floor(Math.random() * 256);
	var rd=r, gd=g, bd=b;
	var rand = Math.floor(Math.random() * 3);
	
	if(cnt == 40) h = 10;
	
	switch(rand){
		case 0 : ((r-h) < 0) ? rd = (r+h) : rd = (r-h);
				((g-h) < 0) ? gd = (g+h) : gd = (g-h);
				break;
		case 1 : ((r-h) < 0) ? rd = (r+h) : rd = (r-h);
				((b-h) < 0) ? bd = (b+h) : bd = (b-h);
				break;
		case 2 : ((g-h) < 0) ? gd = (g+h) : gd = (g-h);
				((b-h) < 0) ? bd = (b+h) : bd = (b-h);
				break;
	}
	gener_color = "rgb("+r+", "+g+", "+b+")";
	trans_color = "rgb("+rd+", "+gd+", "+bd+")";
	//span_gen_color.textContent = gener_color;
	//span_trs_color.textContent = trans_color;
	//span_diff_pos.textContent = diff+1;	
}

//apply color to all objects
function set_color(){	
	for (var i=0; i<objects.length; i++){
		if(i == diff)
			objects[i].style.background = trans_color;	
		else
			objects[i].style.background = gener_color;
	}
	
	
}

//add more objects to fit in matrix
function add_more(m,n){
	//console.log('make '+m+'by'+m+'matrix and add '+n+'objects');
	var headID = document.getElementsByTagName("head")[0];
	var cssNode = document.createElement('link');
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.href = '/views/main'+m+'.css';
	headID.appendChild(cssNode);
	num_objects = m;
	add_object(n);
}


/* relate to game execute*/

//reset user data
reset.addEventListener("click", function(){
	
	overlay_on();
	
	setTimeout('location.reload()', 1000);
	
});

//EventListener for click input
function touch(){
	for (var i=0; i<objects.length; i++){
		objects[i].addEventListener("click", function(){
			if (this.style.background === trans_color)
				clear();
		});
	}
}

//go to next stage
function clear(){
	for (var i=0; i<objects.length; i++)
		objects[i].style.background = trans_color;
	//clearTimeout(time); 
	initialize();
}

//after gameover, enable fade-in transition and send stage data to rank page
function end(){
	overlay_on();
	setTimeout("location.href = '/auth/ranking?'+score_sum;",1000);
}

//game start
function initialize(){
	
	
	cnt+=1;
	score_sum+=score_inc;
	
	if (cnt==1) score_inc=1000;
	else if (cnt==6){
		add_more(16,8);
		score_inc=1500;
	}
	else if(cnt==13){
		 add_more(25,10);
		 score_inc=2000;
	}
	else if(cnt==21){
		 add_more(36,12);
		 score_inc=2500;
	}
	else if(cnt==30){
		add_more(49,14);
		score_inc=3000;
	}
	else if(cnt==40){
		add_more(64,16);
		score_inc=3500;
	
	}
	else if(cnt==45) score_inc=4000;

	stat_stage.textContent = cnt;
	
	rand_color(num_objects);
	set_color();
	//timer(sec);
	touch();
	timebar();
}