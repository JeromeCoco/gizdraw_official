cordova.define("cordova-plugin-zoomcontrol.ZoomControl", function(require, exports, module) {
var exec = require("cordova/exec");

function ZoomControl() {};

ZoomControl.prototype.ZoomControl = function(enabled) {
	exec(null, null, "ZoomControl", "ZoomControl", [enabled]);
};

var ZoomControl = new ZoomControl();
module.exports = ZoomControl;

});
