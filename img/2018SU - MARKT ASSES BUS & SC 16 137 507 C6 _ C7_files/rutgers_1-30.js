/*EvaluationKIT START*/var evalkit_jshosted = document.createElement('script');evalkit_jshosted.setAttribute('type', 'text/javascript');evalkit_jshosted.setAttribute('src', 'https://rutgers-sirs.evaluationkit.com/CanvasScripts/rutgers-sirs.js?v=1');document.getElementsByTagName('head')[0].appendChild(evalkit_jshosted);/*EvaluationKIT END*/

/*Activate Accordions*/
$(document).ready(function(){
   $('div.accordion-custom').accordion({heightStyle: "content"});
});


/*ReadSpeaker*/
(function(){window.rsConf={params:"https://f1-na.readspeaker.com/script/default/canvas/ReadSpeaker.js?pids=embhl&skin=ReadSpeakerToggleSkin2"};window.rsConf.toggle={customerParams:{customerid:"8909",lang:["en_us"],region:"na",voice:null,readid:null,url:null},addPreserve:[".nav"],addSkip:[".nav"],readids:["course_home_content","discussion_container","assignment_show","content"],useIcons:!0};var d=document.getElementsByTagName("HEAD").item(0),a=document.createElement("script");a.setAttribute("type",
"text/javascript");a.src="https://f1-na.readspeaker.com/script/default/canvas/ReadSpeaker.js";var b=function(){ReadSpeaker.init()};a.onreadystatechange=a.onload=function(){var c=a.readyState;if(!b.done&&(!c||/loaded|complete/.test(c)))b.done=!0,b();ReadSpeaker.q(function(){ReadSpeaker.Toggle.init()})};(document.body||d).appendChild(a)})();

/*Add User Text*/
$('#addUsers').live('click', function(){
$('#create-users-step-1>p:first-of-type').replaceWith('<p>Type or paste a list of users (Rutgers NetID or email) that you would like added:<br> <br><b>Note:</b> We recommend using NetID(s).  If you receive an error, the user may not have a Canvas account yet.  Please contact help@canvas.rutgers.edu to have the account created and added to your course.</p>');

$('#user_list_textarea').attr( "placeholder", "Enter the users you would like to add by NetID or email." ).attr( "aria-label", "Enter the users you would like to add by NetID or email." );
});


/*ProctorTrack - Added 1.30.17 DS - Start*/
/*
Global JS version 0.210032015
Purpose -
1. If the app is not running in the background , warn the user. This is checked continuously every 10 seconds.
2. hide the take quiz button if quiz is being proctored by proctortrack to stop students from directly going to the quiz.
3. hide get access code button during exam while proctoring is on.
4. auto close Proctortrack application after exam is submitted.
*/

/*
This function is a generic cookie creation function, used by appCheckInitiate. 
params :
    name - name of the cookie
    value - value of the cookie
    minutes - how long the cookie should last in minutes
*/
function createCookie(name,value,minutes) {
    if (minutes) {
        var date = new Date();
        date.setTime(date.getTime()+(minutes*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
    console.log('cookie has been created');
}

/*
This function is a generic cookie reading function, used by continuousCheck. 
params : 
    name - name of the cookie to read
*/
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

/* 
Initiates app check. In order to identify if the proctored quiz was started properly
a cookie with name proctortrack is set with the value started. 
The cookie is set when student opens an assignment which starts with [Proctoring]. 
Right now the information doesnt store which for which quiz proctoring is being started by the student. 
That can be added later if required. Right now it is sufficient to know that a student
will be starting a proctored quiz in next 30 minutes. Existence of the cookie named proctortrack is sufficient 
to do that. 
*/
var appCheckInitiate= function() {
    breadcrumbs = document.getElementById('breadcrumbs').childNodes[0].childNodes;
    page_title = breadcrumbs[breadcrumbs.length - 1].textContent;
    console.log('Page title is ' + page_title);
    type = breadcrumbs[2].textContent;
    if(type == "Assignments" && page_title.indexOf("[Proctoring]") == 0) {
        console.log('creating the cookie');
        //Proctoring is starting and set a cookie to last for next 30 mins.
        createCookie('proctortrack', 'started', 30);
    }else if (document.title.toLowerCase().indexOf('proctortrack') > -1 && document.location.pathname.indexOf("external_tools") > -1) {
        // For new canvas flow check "proctortrack" in document title and "external tools" in url
        console.log('creating the cookie');
        //Proctortack process is starting and set a cookie to last for next 30 mins.
        createCookie('proctortrack', 'started', 30);
    }
};
/*
sets quiz started cookie when student enters exam and count down timer starts. It will set cookie only if no such cookie
was present. We are setting expire time of cookie to 200 mins just little more than 3 hours assuming this will cover all proctored exams
*/
var setQuizStartedCookie = function(){
    if(!readCookie('pt_quiz_started')){
        createCookie('pt_quiz_started', 'true', 200);
    }
};

/*
Doesnt stop the quiz as the name suggests but warns the user when proctoring is not found to be running.
*/
var stopQuiz = function() {
    var action = quiz_stop_action;
    //called in when app is not running and quiz is to be stopped, alert only if this is Proctortrack quiz
    isInstructor = Boolean(document.getElementById('quiz-publish-link'));
    isQuizProctortrack = Boolean(document.getElementById('get_proctortrack_access_code'));
    if (isQuizProctortrack && !isInstructor) {
        if (action == quiz_stop_action_options[0]){
            // Do nothing
        } else if (action == quiz_stop_action_options[1]){
            alert('Proctortrack App was stopped in between the quiz. You need to go back and start the whole process again.');
        } else if (action == quiz_stop_action_options[2]){
            submitQuiz();
        }
    }
};

var submitQuiz = function(){
    // This function will be called only once during quiz session for submitting a canvas quiz.
    alert('Proctortrack App is not getting detected. Please close and restart Proctortrack application to continue.');
    var realConfirm=window.confirm;
    window.confirm=function(){
        window.confirm=realConfirm;
        return true;
    };
    document.getElementById('submit_quiz_button').click();
    createCookie('pt_quiz_started', 'true', -1); // delete quiz started cookie
};
/*
calls app API endpoint to close app. If somehow app did not respond with positive reply API end point will be retried.
*/
var closeProctoring = function(){
    var xmlhttp = new XMLHttpRequest();
    var url = 'https://app.verificient.com:' + app_port + '/proxy_server/app/close_proctoring/';
    xmlhttp.open('GET', url, true);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var data = JSON.parse(xmlhttp.responseText);
            if (data.closing_proctoring !== true){
                setTimeout(function(){
                    closeProctoring(app_port);
                }, 5000);
            }
        }
    };
    xmlhttp.send();
};
/*
Continuously calls checkAppStatus function when student is trying to take a quiz which is proctored.
This function pings the app assuming port has been found. The port will not be found only in 
the case student doesnt start the app at all. Which can be avoided by hiding the take quiz button.
*/
var continuousCheck = function() {
    breadcrumbs = document.getElementById('breadcrumbs').childNodes[0].childNodes;
    type = breadcrumbs[2].textContent;
    ptQuizStartedCookie = readCookie('pt_quiz_started');
    //console.log('in continuous app check' + type + proctortrack_cookie);
    isQuizProctortrack = Boolean(document.getElementById('get_proctortrack_access_code'));
    quiz_started = Boolean(document.getElementById('submit_quiz_button'));
    if(isQuizProctortrack && type == 'Quizzes' && quiz_started) {
        checkAppStatus(app_port, function() {
            console.log('App is running fine on port' + app_port);
            hideGetAccessCodeButton();
            setQuizStartedCookie();
        }, function() {
            console.log('App has stopped running');
            stopQuiz();
        });
        setTimeout(continuousCheck, 10000);
    }else if (isQuizProctortrack && type == 'Quizzes' && !quiz_started && ptQuizStartedCookie == 'true'){
        // student has completed exam. delete ptQuizStarted cookie and close the app
        createCookie('pt_quiz_started', 'true', -1);
        closeProctoring();
    }
};
/*
Pings the app by calling an api endpoint. API will return HTTP error code if :
1. The app is not running
2. app is running but proctoring is not on
*/
var checkAppStatus = function (app_port, call_back, failCallback) {
    var xmlhttp = new XMLHttpRequest();
    var url = 'https://app.verificient.com:' + app_port + '/proxy_server/app/proctoring_started/';
    xmlhttp.open('GET', url, true);
    xmlhttp.onreadystatechange = function () {
        // wait until request is completed
        if (xmlhttp.readyState !== 4) return;
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            // app is running
            var data = JSON.parse(xmlhttp.responseText);
            if (data.proctoring){
                // proctoring started
                window.port = app_port;
                call_back();
            } else{
                // app is running but proctoring is not started.
                failCallback();
            }
        } else{
            //app is not running and app server is down
            failCallback();
        }
    };
    xmlhttp.send();
};
/*
Hides the button take quiz from all the proctored quizes for a student. 
This is required for continuousCheck() to function properly
Also sets access code button link target to '_self' if it is '_blank'
*/
var hideQuizButton = function() {
    isQuizProctortrack = Boolean(document.getElementById('get_proctortrack_access_code'));
    isInstructor = Boolean(document.getElementById('quiz-publish-link'));
    hasStarted = Boolean(document.getElementById('submit_quiz_button'));
    if(isQuizProctortrack && !isInstructor && !hasStarted) {
        console.log('hide take quiz button');
        quizButton = document.getElementById('take_quiz_link');
        quizButton.style.display = "none";
        setTimeout(setSelfAttrAccessCode, 1000, 1);
    }
};

var setSelfAttrAccessCode = function(count){
    if (count < 10) {
        count++;
        try {
            access_code_btn = document.getElementById('get_proctortrack_access_code');
            if (access_code_btn.getAttribute("target") == '_blank') {
                access_code_btn.setAttribute("target", "_self");
            }
        }
        catch (err) {
            console.log("error in setting target attribute to access buton");
        }
        setTimeout(setSelfAttrAccessCode, 500, count);
    }
};
/*
Hides quiz access code button during quiz while proctoring is on.
*/
var hideGetAccessCodeButton = function(){
    isQuizProctortrack = Boolean(document.getElementById('get_proctortrack_access_code'));
    isInstructor = Boolean(document.getElementById('quiz-publish-link'));
    if(isQuizProctortrack && !isInstructor) {
        console.log('inside hide get acess code function');
        quizButton = document.getElementById('get_proctortrack_access_code');
        quizButton.style.display = "none";
    }
};

/*
This is a backup function, will not be used at all ideally. 
But in case student is able to start the quiz without starting the app altogether
he still gets the warning.
*/
var delayedCheck = function() {
    console.log('two minutes fn');
    proctortrack_cookie = readCookie('proctortrack');
    quiz_started = Boolean(document.getElementById('submit_quiz_button'));
    if(proctortrack_cookie == 'started' && quiz_started && window.port == -1) {
        stopQuiz();
        setTimeout(delayedCheck, 5000)
    }
};


var port = -1;
var app_port = 54545;
var proctoringon = false;
var numberWarnings = 0;
var quiz_stop_action_options = ["Do Nothing", "Alert", "Submit Quiz"];
var quiz_stop_action = quiz_stop_action_options[0]; // Set action number here from above list. Note that this is zero indexed list
hideQuizButton();
appCheckInitiate();
continuousCheck();

/*ProctorTrack Stop*/