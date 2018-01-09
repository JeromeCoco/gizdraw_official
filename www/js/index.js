$(document).ready(function(){
	var lastTimeBackPress=0;
	var timePeriodToExit=2000;
	$('.simple_color_live_preview').simpleColor({ livePreview: true, cellWidth: 15, cellHeight: 15 });
	
	$('#canvas-settings').click(function(){
		$('#canvas-settings-modal').css("display", "block");
	});

	$("#save-image").click(function(){
		$('#save-modal').css("display", "block");
	});

	$('.close').click(function(){
		$('#canvas-settings-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('.close-save').click(function(){
		$('#save-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('.close-connect').click(function(){
		$('#connect-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	$('#close-share').click(function(){
		$('#share-modal').css("display", "none");
		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});	

	$('#canvas-type').change(function(){
		var canvasType = $(this).val();
		if (canvasType == "Color") {
			$('#custom-bg-color').fadeIn('slow');
		} else {
			$('#custom-bg-color').fadeOut('slow');
		}
	});

	$('#connect-pc').click(function(){
		$('#connect-modal').css("display", "block");
	});

	$('#share').click(function(){
		/*$('#share-modal').css("display", "block");*/
	});

	$('#preset-first').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-second').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-third').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	$('#preset-fourth').click(function(){
		$('.presets').removeClass('active-preset');
		$(this).addClass('active-preset');
	});

	function onBackKeyDown(e){
	    e.preventDefault();
	    e.stopPropagation();
	    if(new Date().getTime() - lastTimeBackPress < timePeriodToExit) {
	        navigator.app.exitApp();
	    } else {
	        window.plugins.toast.showWithOptions({
	        	message: "Press again to exit.",
	        	duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
	        	position: "bottom",
	        	addPixelsY: -40  // added a negative value to move it up a bit (default 0)
	        });
	        lastTimeBackPress=new Date().getTime();
	    }
	};

	document.addEventListener("backbutton", onBackKeyDown, false); 
});