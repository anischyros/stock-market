
var graphWidth = pixels2number($("svg").css("width"));
var graphHeight = pixels2number($("svg").css("height"));

var symbols = [];
var colors = ["red", "blue", "green", "orange", "violet", "cyan", "gray"];

var dataset = [];
var xDataPoints;

var oneDay = 1000 * 60 * 60 * 24;

var fromMonth, fromDay, fromYear, toMonth, toDay, toYear;

var socket;

function getCurrentStocks()
{
	$.ajax("getCurrentStocks",
	{
		dataType: "json",
		success: function(data)
		{
			symbols = data;
			processSymbols();
			paintStockControls();
		}
	});
}

function processSymbols()
{
	// If there are no symbols to graph then simply clobber the SVG contents
	if (symbols.length === 0)
	{
		$("svg").html("");
		return;
	}

	dataset = [];

	// For each stock symbol, reverse its data array and append it to the main
	// dataset.  Place its sequence number in the main dataset so we know where
	// it belongs on the X axis.  Place its stock symbol in main dataset so we
	// know which stock the object represents.
	symbols.forEach(function(symbol, ndx)
	{
		d3.csv("/getYahooData?symbol=" + symbol + 
			"&fromMonth=" + fromMonth + "&fromDay=" + fromDay + 
			"&fromYear=" + fromYear + "&toMonth=" + toMonth + 
			"&toDay=" + toDay + "&toYear=" + toYear + "&g=d&ignore=.csv", 
			function(data)
		{
			data.reverse();
			xDataPoints = data.length;
			for (var i = 0; i < data.length; i++)
			{
				data[i].symbol = symbol;
				data[i].sequence = i;
				dataset.push(data[i]);
			}
			if (dataset.length >= symbols.length * data.length)
				drawGraph(dataset);
		});
	});
}

function drawGraph(data)
{
	// Clobber the SVG contents
	$("svg").html("");

	var xAxisPadding = 20;
	var yAxisPadding = 50;

	// Create the X axis scale
	var xScale = d3.scale.linear()
		.domain([0, xDataPoints])
		.range([yAxisPadding, graphWidth - yAxisPadding]);

	// Create the Y axis scale
	var yScale = d3.scale.linear()
		.domain([0, d3.max(data, function(d) { return +d.Close; })])
		.range([graphHeight - xAxisPadding, xAxisPadding]);

	// Create an X axis scale that will be used to draw the X axis only
	var minDate = convertDate(data[0].Date);
	var maxDate = convertDate(data[data.length - 1].Date);
	var xTimeScale = d3.time.scale()
		.domain([minDate, maxDate])
		.range([yAxisPadding, graphWidth - yAxisPadding]);

	// Create the X and Y axes
	var xAxis = d3.svg.axis()
		.scale(xTimeScale)
		.orient("bottom");
	var yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("right");

	// Set the width and height of the SVG stub in the HTML page
	var svg = d3.select("svg")
		.attr("width", graphWidth)
		.attr("height", graphHeight);

	// Plot the data
	svg.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", function(d) { return xScale(d.sequence); })
		.attr("cy", function(d) { return yScale(+d.Close); })
		.attr("r", 3)
		.attr("stroke", "gray")
		.attr("fill", function(d) { 
			return colors[symbols.indexOf(d.symbol)]; } )
		.append("title")
		.text(function(d) {
			return d.symbol.toUpperCase() + ": " + d.Close + " (" + 
				d.Date + ")"; });

	// Hang the X axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (graphHeight - xAxisPadding) + ")")
		.call(xAxis);

	// Hang the Y axis
	svg.append("g")
		.attr("class", "axis")
		.call(yAxis);
}

function onStockControlClick(symbol)
{
	$.ajax("/removeStock",
	{
		data:
		{
			symbol: symbol
		},
		dataType: "json",
	});
}

function onStockCodeFormSubmitSuccess(json)
{
	var symbol = $("#stock-code").val().toUpperCase();

	if (json.success === false)
	{
		window.alert("Stock " + symbol + " does not exist.");
		return;
	}

	$("#stock-code").val("");

	var found = false;
	for (var i = 0; i < symbols.length; i++)
	{
		if (symbols[i].toUpperCase() == symbol)
		{
			found = true;
			break;
		}
	}
	if (found)
	{
		window.alert("You are already viewing stock " + symbol + ".");
		return;
	}

	$.ajax("/addNewStock",
	{
		data:
		{
			symbol: symbol
		},
		dataType: "json",
	});
}


function onStockCodeFormSubmit()
{
	var symbol = $("#stock-code").val().toUpperCase();
	$.ajax("/doesStockExist",
	{
		data:
		{
			symbol: symbol
		},
		dataType: "json",
		success: onStockCodeFormSubmitSuccess
	});

	return false;
}

function paintStockControls()
{
	var s = "";
	symbols.forEach(function(symbol, ndx)
	{
		s += "<button type='button' " + "style='color: " + colors[ndx] + "' " +
			"onclick='onStockControlClick(\"" + symbol + "\")'>" + 
			symbol.toUpperCase() + "</button>";
	})
	$("#stock-controls").html(s);
}

function showFiveYears()
{
	var now = new Date();
	var toDate = new Date(now.getTime() - oneDay);
	var fromDate = new Date(toDate);
	fromDate.setYear(fromDate.getFullYear() - 5);

	fromMonth = fromDate.getMonth();
	fromDay = fromDate.getDate();
	fromYear = fromDate.getFullYear();
	toMonth = toDate.getMonth();
	toDay = toDate.getDate();
	toYear = toDate.getFullYear();

	processSymbols();
}

function showOneYear()
{
    var now = new Date();
    var toDate = new Date(now.getTime() - oneDay);
    var fromDate = new Date(toDate);
    fromDate.setYear(fromDate.getFullYear() - 1);

    fromMonth = fromDate.getMonth();
    fromDay = fromDate.getDate();
    fromYear = fromDate.getFullYear();
    toMonth = toDate.getMonth();
    toDay = toDate.getDate();
    toYear = toDate.getFullYear();

    processSymbols();
}

function showNinetyDays()
{
	var now = new Date();
	var toDate = new Date(now.getTime() - oneDay);
	var fromDate = new Date(toDate.getTime() - oneDay * 90);

    fromMonth = fromDate.getMonth();
    fromDay = fromDate.getDate();
    fromYear = fromDate.getFullYear();
    toMonth = toDate.getMonth();
    toDay = toDate.getDate();
    toYear = toDate.getFullYear();

	processSymbols();
}

function showThirtyDays()
{
	var now = new Date();
	var toDate = new Date(now.getTime() - oneDay);
	var fromDate = new Date(toDate.getTime() - oneDay * 30);

    fromMonth = fromDate.getMonth();
    fromDay = fromDate.getDate();
    fromYear = fromDate.getFullYear();
    toMonth = toDate.getMonth();
    toDay = toDate.getDate();
    toYear = toDate.getFullYear();

	processSymbols();
}

function convertDate(dateString)
{
	var a = dateString.split("-");
	var year = +a[0];
	var month = +a[1];
	var day = +a[2];
	return new Date(year, month - 1, day);
}

function pixels2number(pixels)
{
	if (!pixels.endsWith("px"))
		return Number(pixels);
	return Number(pixels.substring(0, pixels.length - 2));
}

function onStockCodeInput()
{
	$("#submit-button").prop("disabled", $("#stock-code").val().length == 0);
}

$(document).ready(function()
{
	// Set up Websocket interface.  It will control the remote updating of
	// the graph when a stock is added or removed.
	socket = io.connect("/");
	socket.on("notification", function(data)
	{
		getCurrentStocks();
	});

	// Initialize date variables
    var now = new Date();
    var toDate = new Date(now.getTime() - oneDay);
    var fromDate = new Date(toDate);
    fromDate.setYear(fromDate.getFullYear() - 1);
    fromMonth = fromDate.getMonth();
    fromDay = fromDate.getDate();
    fromYear = fromDate.getFullYear();
    toMonth = toDate.getMonth();
    toDay = toDate.getDate();
    toYear = toDate.getFullYear();

	$("#submit-button").prop("disabled", true);

	// Start the process of painting the graph
	getCurrentStocks();
});
