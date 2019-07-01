var svgWidth = document.getElementById('container').offsetWidth * 0.75;
var svgHeight = window.innerHeight * 0.6;

var margin = {
    top: svgHeight * 0.1,
    bottom: svgHeight * 0.25,
    right: svgWidth * 0.1,
    left: svgWidth * 0.1
};

var height = svgHeight - margin.top - margin.bottom;
var width = svgWidth - margin.left - margin.right;

// Initialize chart choices
var chosenGroup = 'Overall';
var chosenYAxis = 'Overall';

// Function for updating x-scale var upon click on axis label
function xScale(playerData) {
    var xBandScale = d3.scaleBand()
        .domain(playerData.map(d => d.Name))
        .range([0, width * 1.1])
        .padding(0.25);

    return xBandScale;
}

// Function for updating y-scale var upon click on axis label
function yScale(playerData, chosenYAxis) {
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(playerData, d => d[chosenYAxis]) * 0.9, d3.max(playerData, d => d[chosenYAxis]) * 1.025])
        .range([height, 0]);

    return yLinearScale;
}

function buildChart(whichSort, response) {

    // Empty the SVG element and start from scratch each time this function is called
    var svgArea = d3.select('svg');

    if (!svgArea.empty()) {
        svgArea.remove();
    };

    // Append SVG element
    var svg = d3
        .select("#bar")
        .append("svg")
        .attr("height", svgHeight)
        .attr("width", svgWidth)

    // Append group element
    var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // create scales
    var xBandScale = xScale(response);

    var yLinearScale = yScale(response, whichSort);

    // create axes
    var bottomAxis = d3.axisBottom(xBandScale);
    var leftAxis = d3.axisLeft(yLinearScale).ticks(8, 's');

    // append axes
    var xAxis = chartGroup.append('g')
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-30)')
        .style('font-size', '1.3em');

    var yAxis = chartGroup.append('g')
        .call(leftAxis)
        .selectAll('text')
        .style('font-size', '1.3em');

    // append bars
    var barsGroup = chartGroup.selectAll('.bar')
        .data(response)
        .enter()
        .append('rect')
        .classed('bar', true)
        .attr('x', d => xBandScale(d.Name))
        .attr('y', d => yLinearScale(d[whichSort]))
        .attr('width', xBandScale.bandwidth())
        .attr('height', d => height - yLinearScale(d[whichSort]));

    // tooltips
    var toolTip = d3.select('#bar')
        .append('div')
        .classed('d3-tip', true);

    barsGroup.on('mouseover', function (d, i) {

        var xPosition = parseFloat(d3.select(this).attr('x')) - 50;
        var yPosition = parseFloat(d3.select(this).attr('y')) / 4;

        if (chosenYAxis == 'Overall') {
            var yLabel = 'Rating';
            var yValue = d.Overall;
        } else {
            var yLabel = 'Value (Euros)';
            var yValue = d3.format('.3s')(d.Value);
        };

        toolTip.style('display', 'block');
        toolTip.html(`
            <br>
            <h5><strong>${d.Name}</strong></h5>
            <img src=${d.Photo} alt='Player Image' height=75 width = 72>
            <br>
            <br>
            <h6>Nationality</h6>
            <h6>${d.Nationality}</h6>
            <br>
            <h6>${yLabel}</h6>
            <h6>${yValue}</h6>`)
            .style('left', xPosition + 'px')
            .style('top', yPosition + 'px');
    })
        .on('mouseout', function () {
            toolTip.style('display', 'none');
        });

    // title
    var barsTitle = chartGroup.append('text')
        .attr('x', (width / 2))
        .attr('y', 0 - margin.top / 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '1.5em')
        .style('font-weight', 'bold')
        .style('text-decoration', 'underline')
        .text('Top Players');

    // generate national flag image; if looking at overall top players, no flag image
    if (chosenGroup == 'Overall') {
        var flagHtml = '';
    } else {
        var flagHtml = `<img src=${response[0].Flag} alt='Flag Image' width=${width / 10} height=${height / 10}>`;
    };

    var flagDiv = chartGroup.append('foreignObject')
        .attr('x', (width / 2) * .9)
        .attr('y', height + margin.top * 1.2)
        .attr('width', (width / 5))
        .attr('height', (height / 5))
        .classed('node', true)
        .append('xhtml:div')
        .style('width', '100%')
        .style('height', '100%')
        .html(`${flagHtml}`);

    // Create group for 2 y-axis labels
    var yLabelsGroup = chartGroup.append('g')
        .classed('axisGroup', true)
        .attr('transform', `translate(${0 - document.getElementById("container").offsetWidth * .03},
                    ${height / 2})`);

    var overallLabel = yLabelsGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0)
        .attr('y', -40)
        .attr('value', 'Overall')
        .attr('id', 'Overall')
        .classed('active', true)
        .text('Rating (0 to 100)');

    var valueLabel = yLabelsGroup.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0)
        .attr('y', -20)
        .attr('value', 'Value')
        .attr('id', 'Value')
        .classed('inactive', true)
        .text('Value (Euros)');

    var ylabelsSelector = d3.select('.axisGroup');

    // event listener for clicking on different yAxis label
    ylabelsSelector.selectAll('text')
        .on('click', function () {
            var value = d3.select(this).attr('value');
            if (value != chosenYAxis) {
                chosenYAxis = value;
                chosenGroup = d3.select('#countrySet').property('value');
                d3.json('/bar/' + chosenGroup + '/' + chosenYAxis).then(responseClick => {

                    // parse data
                    responseClick.forEach((responseItem) => {

                        Object.keys(responseItem).forEach(key => {
                            if (key == 'Overall' || key == 'Value') {
                                responseItem[key] = +responseItem[key];
                            };
                        });
                    });

                    var returnValuesClick = buildChart(chosenYAxis, responseClick);
                    var overallLabel = returnValuesClick[0];
                    var valueLabel = returnValuesClick[1];

                    if (chosenYAxis == "Overall") {
                        overallLabel
                            .classed('active', true)
                            .classed('inactive', false);
                        valueLabel
                            .classed('active', false)
                            .classed('inactive', true);
                    } else {
                        overallLabel
                            .classed('active', false)
                            .classed('inactive', true);
                        valueLabel
                            .classed('active', true)
                            .classed('inactive', false);
                    };
                });
            };
        });

    return [overallLabel, valueLabel];
}

// initial function upon page loading for first time
function init() {

    // create dropdown
    var dropdownBox = d3.select('#bar')
        .append('select')
        .attr('id', 'countrySet')
        .on('change', onchange);

    // populate dropdown
    d3.json('/bar/countries').then(countryNames => {
        d3.json('/bar/' + chosenGroup + '/' + chosenYAxis).then(response => {
            countryNames.forEach(country => {
                dropdownBox
                    .append('option')
                    .text(country)
                    .property('value', country);
            });

            response.forEach(responseItem => {
                Object.keys(responseItem).forEach(key => {
                    if (key == 'Overall' || key == 'Value') {
                        responseItem[key] = +responseItem[key];
                    };
                });
            });

            // build chart
            buildChart(chosenYAxis, response);
        })
    });
}

// Function for updating chart when new dropdown option is selected
function onchange() {
    chosenYAxis = 'Overall'
    chosenGroup = d3.select('#countrySet').property('value');
    if (chosenGroup == 'Overall') {
        d3.json('/bar/' + chosenGroup + '/Overall').then(response => {

            response.forEach(responseItem => {
                Object.keys(responseItem).forEach(key => {
                    if (key == 'Overall' || key == 'Value') {
                        responseItem[key] = +responseItem[key];
                    };
                });
            });

            buildChart(chosenYAxis, response);
        });
    } else {
        d3.json('/bar/' + chosenGroup + '/Overall').then(response => {

            response.forEach(responseItem => {
                Object.keys(responseItem).forEach(key => {
                    if (key == 'Overall' || key == 'Value') {
                        responseItem[key] = +responseItem[key];
                    };
                });
            });

            buildChart('Overall', response);
        });
    };
}

init();