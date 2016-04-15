if (!window.jGroupdocs)
    window.jGroupdocs = {};

jGroupdocs.html = {
    toText: function (html) {
        return (html && html.length ? html.replace(/<div>|<li>|<ul>|<p>|<br\s*[\/]?>/ig, '\n')
            .replace(/<li>/ig, '  *  ')
            .replace(/<[^>]+>/ig, '') : '');
    },

    textWidth: function (text, fontProp) {
		var tag = document.createElement("div");
		tag.style.position = "absolute";
		tag.style.left = "-999em";
		tag.style.whiteSpace = "nowrap";
		tag.style.font = fontProp;
		tag.innerHTML = text;

		document.body.appendChild(tag);

		var result = tag.clientWidth;

		document.body.removeChild(tag);

		return result;
	}
};

jSaaspose.utils = {
    getSequenceNumber: (function () {
        var sn = 1000;
        return function () { return ++sn; };
    })(),

    getName: function (path) {
        return path != null ? path.replace(/.*(\/|\\)/, '') : '';
    },

    getExt: function (path) {
        var name = (path != null ? Container.Resolve('PathProvider').getName(path) : '');
        return name.replace(/.*[\.]/, '');
    },

    getHexColor: function (color) {
        return '#' + ('000000' + (color && color.toString ? color.toString(16) : '')).substr(-6);
    }
};