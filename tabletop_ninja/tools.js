
function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}
function getContrastYIQ(hexcolor) {
    if (typeof hexcolor !== 'undefined') {
        hexcolor = hexcolor.replace("#", "");
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    } else {
        return "black";
    }
}

function generateUniqueId()
{
    return Math.floor(Math.random()*16777215).toString(16);
}

function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
}

async function getMeta(url) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function getFullPlayer(myid) {
    return {
        index: myid,
        id: globalconfig.elm.id[myid],
        name: globalconfig.elm.name[myid],
        color: globalconfig.elm.color[myid],
        pos: globalconfig.elm.pos[myid],
        isplayer: globalconfig.elm.isplayer[myid],
        visible: globalconfig.elm.visible[myid],
        size: globalconfig.elm.size[myid],
        values: globalconfig.elm.values[myid],
        type: globalconfig.elm.type[myid]
    };
}

function setFullPlayer(myelement) {
    globalconfig.elm.id[myelement.index] = myelement.id;
    globalconfig.elm.name[myelement.index] = myelement.name;
    globalconfig.elm.color[myelement.index] = myelement.color;
    globalconfig.elm.pos[myelement.index] = myelement.pos;
    globalconfig.elm.isplayer[myelement.index] = myelement.isplayer;
    globalconfig.elm.visible[myelement.index] = myelement.visible;
    globalconfig.elm.size[myelement.index] = myelement.size;
    globalconfig.elm.values[myelement.index] = myelement.values;
    globalconfig.elm.type[myelement.index] = myelement.type;
}