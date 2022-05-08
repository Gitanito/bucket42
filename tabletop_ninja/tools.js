
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
