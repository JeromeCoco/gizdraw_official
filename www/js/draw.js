(function() {	
	
	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	var markerWidth = 5;	
	var markerColor = $('#pen-color').val();
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	var clrpckr = false;
	var pen = true;
	var blend = false;
	var erase = false;
	var brush = false;
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
		console.log(markerColor);
		tmp_ctx.strokeStyle = markerColor;
		tmp_ctx.fillStyle = markerColor;
	});
		
	// $('#blender').click(function() {
	// 	markerColor = 'rgba(0,0,0,0.7)';
	// 	tmp_ctx.strokeStyle = markerColor;
	// 	tmp_ctx.fillStyle = markerColor;
	// 	markerWidth = parseInt($('#pen-width').val());
	// 	tmp_ctx.lineWidth = markerWidth;
	// 	blend = true;
	// });

	tmp_canvas.addEventListener('touchstart', function(e) {
		tmp_canvas.addEventListener('touchmove', onPaint, false);
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		ppts.push({x: mouse.x, y: mouse.y});

		if (clrpckr == true) {
			ctx.globalCompositeOperation = 'source-over';
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
			var rgb = R + ',' + G + ',' + B + ',' + A;

			var hex = rgbToHex(R, G, B);

			// if (hex)
			console.log(rgb + ',' + hex + ',' + A );
			if (A == 0) {
				if (bgIsColored) {
					markerColor = bgColor;
				} else {
					markerColor = '#FFF';
				}
			} else {
				markerColor = '#'+ hex;
			}
			$('#pen-color').val(markerColor);
			console.log(markerColor);
			tmp_ctx.strokeStyle = markerColor;
			tmp_ctx.fillStyle = markerColor;
		}
		else if (pen == true) {
			ctx.globalCompositeOperation = 'source-over';
			markerColor = $('#pen-color').val();
			tmp_ctx.strokeStyle = markerColor;
			tmp_ctx.fillStyle = markerColor;
			onPaint();
			console.log("onpaint");
			console.log(markerColor);
		}
		else if (eraser == true) {
			onErase();
		}

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

	var onErase = function() {
		
		if (bgIsColored) {
			eraserColor = bgColor;
		} else {
			eraserColor = '#FFF';
		}
		tmp_ctx.strokeStyle = eraserColor;
		tmp_ctx.fillStyle = eraserColor;

		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,0)';
		ctx.strokeStyle = 'rgba(0,0,0,0)';
		ctx.lineWidth = 5;
		
		if (ppts.length < 3) {
			var b = ppts[0];
			ctx.beginPath();
			ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			ctx.fill();
			ctx.closePath();
			
			return;
		}

		ctx.beginPath();
		ctx.moveTo(ppts[0].x, ppts[0].y);
		
		for (var i = 1; i < ppts.length - 2; i++) {
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			
			ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		
		// For the last 2 points
		ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		ctx.stroke();

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
		var cPushArray = new Array();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	$('#new-canvas').click(function(){
		resetCanvas();
		var cPushArray = new Array();
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
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
	        canvasPic.onload = function () { 
	        		ctx.drawImage(canvasPic, 0, 0); 
	        		// ctx.replaceWith(canvasPic, 0, 0);
	        	}
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

	$('#color-picker').click(function(){
		clrpckr = true;
		eraser = false;
		pen = false;
		brush =false;
		console.log(clrpckr);
	});

	$('#pencil').click(function(){
		pen = true;
		clrpckr = false;
		eraser = false;
		brush =false;
	});
	$('#eraser').click(function() {
		eraser = true;
		pen = false;
		clrpckr = false;
		brush =false;
	});

	var bgColor;
	var bgIsColored = false;

	$('#setCanvasType').click(function(){
		if ($('#canvas-type').val() == "Color") {
			bgColor = $('#custom-bg-color').val();
			bgIsColored = true;
		} else {
			bgIsColored = false;
		}
	});

	$('#brush').click(function (){
		brush= true;
		eraser = false;
		clrpckr = false;
		pen = false;
		tmp_ctx.lineWidth = 1;
		tmp_ctx.lineJoin = tmp_ctx.lineCap = 'round';
				

		tmp_canvas.addEventListener('touchstart', function(e) {
		tmp_canvas.addEventListener('touchmove', OnDraw, false);
		
		points = [ ];
		isDrawing = true;
	
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;

		points.push({ x: mouse.x, y: mouse.y });
		if (clrpckr == true) {
			return;
		}
		else if (pen == true) {
			return;
		}
		else if (eraser == true) {
			onErase();
		}
		else if (brush == true) {
			ctx.globalCompositeOperation = 'source-over';
			OnDraw();
		}
	});

	var OnDraw = function (){

			if (!isDrawing) return;
			points.push({ x: mouse.x, y: mouse.y });
			tmp_ctx.beginPath();
			tmp_ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
			tmp_ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
			tmp_ctx.stroke();

			var lastPoint = points[points.length-1];

		  	for (var i = 0, len = points.length; i < len; i++) {
		    dx = points[i].x - lastPoint.x;
		    dy = points[i].y - lastPoint.y;
		    d = dx * dx + dy * dy;
		    if (brush == true) {
			    if (d < 1000) {
			      ctx.beginPath();
			      $('#pen-color').val(markerColor);
			      var rgbaval = hexToRgbA(markerColor);
				  ctx.strokeStyle = rgbaval;
			      ctx.moveTo(lastPoint.x + (dx * 0.2), lastPoint.y + (dy * 0.2));
			      ctx.lineTo(points[i].x - (dx * 0.2), points[i].y - (dy * 0.2));
			      ctx.stroke();
			    }
		    }
		    else {
		    	return;
			  }
		    }
	};
	
	tmp_canvas.addEventListener('touchend', function(){
		isDrawing = false;
		points.length = 0;
	})

});
	// hex to rgba conversion
	function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.3)';
    }
    // throw new Error('Bad Hex');
	}
}());