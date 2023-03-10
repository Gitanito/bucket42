
let oscillators = [];
let gains = [];
let pans = [];
let freqcount = 1;
let fullvolume = null;
let duration = 10;
let startsec = 0;
let endsec = 0;
let running = false;
let runningfreq = 0;

let minutesControl = null;
let volumeControl = null;
let mbControl = null;
let soloControl = null;
let solo = false;
let activelement = null;


function drawTiles () {
    let lastgroup = "";
    for (let i = 0; i < list.length; i++) {
        if (lastgroup != list[i].group) {
            $('#freq').append('<div class="w-100"><h2><br>' + list[i].group + '</h2></div>');
        }
        lastgroup = list[i].group;

        $('#freq').append(
            '<div class="col ' + list[i].tags + '">\n' +
            '                        <div data-f="' + i + '" class="box card card-cover h-100 overflow-hidden text-white bg-dark rounded-5 shadow-lg" style="border: 5px solid ' + list[i].col + ';background-size: cover; background-position-x: center; background-position-y: center; background-image: url(' + list[i].img + ');">\n' +
            '                            <img class="playbutton" src="img/play.png">' +
            '                            <img class="stopbutton" src="img/stop.png">' +
            '            <div class="balken" style="background-color: ' + list[i].col + '"></div>' +
            '            <div class="d-flex flex-column h-100 p-2 pb-3 text-white text-shadow-3">\n' +
            '                                <h2 class="pt-5 mt-5 mb-4 display-6 lh-1 fw-bold text-white text-shadow text-decoration-none">\n' +
            '                                    ' + list[i].name + '</h2><h5 class="text-shadow"> ' + list[i].desc + '</h5>\n' +
            '                            </div>\n' +
            '                        </div>\n' +
            '                </div>'

        );
    }
}
function start () {
    stop();
    if (running) {
        running = false;
        return;
    }

    if (!confirm("WARNUNG!\nVerwenden Sie diese Funktion NICHT während Sie ein Fahrzeug bewegen, oder in anderer Weise Ihre volle Aufmerksamkeit gefordert ist. Diese Frequenzen KÖNNEN direkt auf Ihr Wohlbefinden wirken. Nehmen Sie eine entspannte Position im Sitzen oder Liegen ein bevor Sie starten.")) {
        return;
    }
    running = true;
    let set = list[activelement.data("f")];
    activelement.find('.balken').addClass('activebalken');
    activelement.find('.playbutton').hide();
    activelement.find('.stopbutton').show();
    $('#freq div.col').addClass('transparent');
    activelement.parent('.col').removeClass("transparent");

    oscillators = [];
    gains = [];
    pans = [];

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    for (let o = 0; o < freqcount; o++) {
        oscillators.push(audioCtx.createOscillator());
        gains.push(audioCtx.createGain());
        pans.push(new StereoPannerNode(audioCtx));
    }

    fullvolume = audioCtx.createGain();
    fullvolume.gain.value = 0.0001;
    fullvolume.connect(audioCtx.destination);

    for (let o = 0; o < freqcount; o++) {
        oscillators[o].connect(gains[o]);
        oscillators[o].type = 'sine';
        pans[o].connect(fullvolume);
        gains[o].connect(pans[o]);
        if (solo) {
            gains[o].gain.value = (!o?1:0.0001);
        } else {
            gains[o].gain.value = set.vol[o];
        }
        pans[o].pan.value = set.pan[o];
    }

    runningfreq = set;
    changeFreq(runningfreq);

    for (let o = 0; o < freqcount; o++) {
        oscillators[o].start();
    }

    fullvolume.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    fullvolume.gain.exponentialRampToValueAtTime(volumeControl.value, audioCtx.currentTime + 2);

    startsec = Date.now();
    duration = minutesControl.value;
    endsec = startsec + (duration * 60000);

}


function changeFreq(set)
{
    //console.log(freq);

    let freq = set.freq;
    /*
            if (mbControl.value === "1" && freq[0] > 80) {
                switch (Math.floor(Math.random() * 6)) {
                    case 0:
                        for (let o = 0; o < freq.length; o++) {
                            freq[o] = freq[o] * 1.03;
                        }
                        break;
                    case 1:
                        for (let o = 0; o < freq.length; o++) {
                            freq[o] = freq[o] * 0.97;
                        }
                        break;
                }
            }
    */
    if (oscillators[0].frequency.value !== freq[0]) {
        for (let o = 0; o < freqcount; o++) {
            oscillators[o].frequency.value = freq[o];
        }
    }

}

function stop() {
    if (running) {
        $('.activebalken').css('width', '0%');
        $('.activebalken').removeClass('activebalken');
        $('.stopbutton').hide();
        $('.playbutton').show();
        $('.transparent').removeClass('transparent');
        try {

            fullvolume.gain.setValueAtTime(fullvolume.gain.value, audioCtx.currentTime);
            fullvolume.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + .01);

            window.setTimeout(function () {
                for (let o = 0; o < freqcount; o++) {
                    oscillators[o].stop();
                }
            }, 10);
        } catch (e) {
        }
    }
}

$(document).ready(function () {
    freqcount = list[0].freq.length;
    minutesControl = document.querySelector("#minutes");
    volumeControl = document.querySelector("#volume");
    mbControl = document.querySelector("#boost");
    soloControl = document.querySelector("#solo");


    drawTiles ();


    $('.box').on('click', function(){ activelement = $(this); start()});


    volumeControl.addEventListener(
        "input",
        () => {
            try {
                $('#volumeshow').text(Math.floor(volumeControl.value * 100));

                fullvolume.gain.setValueAtTime(fullvolume.gain.value, audioCtx.currentTime);
                fullvolume.gain.exponentialRampToValueAtTime(volumeControl.value, audioCtx.currentTime + .001);

            } catch (e){}
        },
        false
    );

    minutesControl.addEventListener(
        "input",
        () => {
            try {
                $('#minutesshow').text(minutesControl.value);
                duration = minutesControl.value;
                endsec = startsec + (duration * 60000);
            } catch (e){}
        },
        false
    );

    mbControl.addEventListener(
        "input",
        () => {
            try {
                if (mbControl.value === "1") {
                    $('#boostshow').text("An");
                } else {
                    $('#boostshow').text("Aus");
                    changeFreq(runningfreq);
                }
            } catch (e){}
        },
        false
    );

    soloControl.addEventListener(
        "input",
        () => {
            try {
                if (soloControl.value === "1") {
                    $('#soloshow').text("An");
                    solo = false;
                    for (let o = 0; o < freqcount; o++) {
                        gains[o].gain.setValueAtTime(gains[o].gain.value, audioCtx.currentTime);
                        gains[o].gain.exponentialRampToValueAtTime(runningfreq.vol[o], audioCtx.currentTime + .01);
                        //gains[o].gain.value = runningfreq.vol[o];
                    }
                } else {
                    $('#soloshow').text("Aus");
                    solo = true;
                    for (let o = 0; o < freqcount; o++) {

                        gains[o].gain.setValueAtTime(gains[o].gain.value, audioCtx.currentTime);
                        gains[o].gain.exponentialRampToValueAtTime((!o?1:0.0001), audioCtx.currentTime + .01);
                        //gains[o].gain.value = (!o?1:0);
                    }
                }
            } catch (e){}
        },
        false
    );
    window.setInterval(function () {
        if (endsec > Date.now()) {
            let newwidth = ((Date.now() - startsec) / ((endsec - startsec) / 100));
            $('.activebalken').css('width', newwidth + '%');
            if (newwidth >= 99.9) {
                stop();
                running = false;
            }

            if (running) {
                changeFreq(runningfreq);
            }
        }
    }, 250);

});
