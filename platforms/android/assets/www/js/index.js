$(document).ready(function(){

	//set pencil as starting tool onload
	$('.tools-item').removeClass('active');
	$('#pencil').addClass('active');

	/*$("#show").click(function(target){
		$("#popover").show(target);
	});

	$("#hide").click(function(target){
		$("#popover").hide();
	});*/

	$('#pencil').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#brush').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#eraser').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#shapes').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#move').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#paintbucket').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});

	$('#colorpicker').click(function(){
		$('.tools-item').removeClass('active');
		$(this).addClass('active');
	});
});