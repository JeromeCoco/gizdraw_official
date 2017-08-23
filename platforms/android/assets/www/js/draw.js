(function() {	
	

	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	var markerWidth = 5;	
	var markerColor = '#000';
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	var clrpckr = false;
	var pen = true;
	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));
	
	// Creating a tmp canvas
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	sketch.appendChild(tmp_canvas);

	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};
	
	// Pencil Points
	var ppts = [];

	/* Mouse Capturing Work */
	tmp_canvas.addEventListener('touchmove', function(e) {
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
	}, false);
	
	/* Drawing on Paint App */
	$('#pen-width').change(function () {
		markerWidth = parseInt($('#pen-width').val());
		tmp_ctx.lineWidth = markerWidth;
		$('#pen-width-label').val(markerWidth);
	});

	// tmp_ctx.lineWidth = markerWidth;
	tmp_ctx.lineJoin = 'round';
	tmp_ctx.lineCap = 'round';

	$('#pen-color').change(function () {
		markerColor = $(this).val();
		tmp_ctx.strokeStyle = markerColor;
		tmp_ctx.fillStyle = markerColor;
	});
	
	tmp_canvas.addEventListener('touchstart', function(e) {
		tmp_canvas.addEventListener('touchmove', onPaint, false);
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		ppts.push({x: mouse.x, y: mouse.y});
		if (clrpckr == true) {
			var canvasPic = new Image();
			canvasPic.src = cPushArray[cStep];

			canvasPic.onload = function () {
				ctx.drawImage(canvasPic, 0, 0);
			}
			// user coordinates
			var targetYval = e.targetTouches[0].pageY;
			var targetXval = e.targetTouches[0].pageX;
			mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
			mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
			// console.log(mouse.x + ',' + mouse.y);

			// image data and RGB values 
			var img_data = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;
			var R = img_data[0];
			var G = img_data[1];
			var B = img_data[2];
			var A = img_data[3];
			console.log(img_data);
			var rgb = R + ',' + G + ',' + B + ',' + A;

			var hex = rgbToHex(R, G, B);

			// if (hex)
			console.log(rgb + ',' + hex + ',' + A );
			if (A == 0) {
				markerColor = '#FFF';
			}
			else {
				markerColor = '#'+ hex;
			}
				console.log(markerColor);
				$('#pen-color').value = markerColor;
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;

		}
		onPaint();
	}, false);
	
	tmp_canvas.addEventListener('touchend', function() {
		tmp_canvas.removeEventListener('touchmove', onPaint, false);
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		// Clearing tmp canvas
		cPush();
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		// Emptying up Pencil Points
		ppts = [];
	}, false);

	var onPaint = function() {
		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		if (ppts.length < 3)
		{
			var b = ppts[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);

		for (var i = 1; i < ppts.length - 2; i++)
		{
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
	};

	var cPushArray = new Array();
	var cStep = -1;

	function cPush(){
    	cStep++;
	    if (cStep < cPushArray.length)
	    { 
	    	cPushArray.length = cStep;
	    }
	    cPushArray.push(canvas.toDataURL());
	}

	function resetCanvas(){
		cStep = -1;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	$('#new').click(function(){
		resetCanvas();
	});

	$('#undo').click(function(){
		if (cStep == 0)
		{
			resetCanvas();
		}
		if (cStep > 0)
		{
	        cStep--;
	        var canvasPic = new Image();
	        var srca = cPushArray[cStep];
	        canvasPic.onload = function (){ 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }
	        canvasPic.src = cPushArray[cStep];
	        // console.log(canvasPic);
	    }
	});

	$('#redo').click(function(){
		if (cStep < cPushArray.length-1)
		{
	        cStep++;
	        var canvasPic = new Image();
	        canvasPic.src = cPushArray[cStep];
	        canvasPic.onload = function () { ctx.drawImage(canvasPic, 0, 0); }
   		}
	});

	function rgbToHex(R,G,B) {
		return toHex(R)+toHex(G)+toHex(B)
	}
	function toHex(n) {
	  n = parseInt(n,10);
	  if (isNaN(n)) return "00";
	  n = Math.max(0,Math.min(n,255));
	  return "0123456789ABCDEF".charAt((n-n%16)/16)  + "0123456789ABCDEF".charAt(n%16);
	}

	// function colorpick() {
	// 	var canvasPic = new Image();
	// 	canvasPic.src = cPushArray[cStep];
	// 	canvasPic.onload = function () {
	// 		ctx.drawImage(canvasPic, 0, 0);
	// 	}
	// 		// console.log(canvasPic);
	// 	// user coordinates
	// 	var targetYval = e.targetTouches[0].pageY;
	// 	var targetXval = e.targetTouches[0].pageX;
	// 	mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
	// 	mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
	// 	// console.log(mouse.x + ',' + mouse.y);

	// 	// image data and RGB values 
	// 	var img_data = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;
	// 	var R = img_data[0];
	// 	var G = img_data[1];
	// 	var B = img_data[2];

	// 	var rgb = R + ',' + G + ',' + B;

	// 	var hex = rgbToHex(R, G, B);


	// 	markerColor = '#'+ hex;
	// 	console.log(markerColor);
	// 	tmp_ctx.strokeStyle = markerColor;
	// 	tmp_ctx.fillStyle = markerColor;
	// }

	$('#color-picker').click(function(){
		clrpckr = true;
		console.log(clrpckr);
	});

	$('#pencil').click(function(){
		clrpckr = false;
		console.log(clrpckr);
	});

	var pinchZoom = new PinchZoomCanvas({
    canvas: document.querySelector('#paint'),
    path: cPushArray,
    momentum: true,
    zoomMax: 2,
    doubletap: true,
    onZoomEnd: function (zoom, zoomed) {
        console.log("---> is zoomed: %s", zoomed);
        console.log("---> zoom end at %s", zoom);
    },
    onZoom: function (zoom) {
        console.log("---> zoom is %s", zoom);
    }
    });
}());