# Bubble Matrix

A **Bubble Matrix** is a two-dimensional representation of information with the help of sizes and colors. The chart is visualized like a matrix with a finite number of rows and columns. Bubbles within the matrix are categorized by two different colors depending upon the segment in which the data value they represent belongs to. Bubble matrix can be useful in helping users to gauge above or below ranges quickly, as well as spotting the most important values by using the highlight feature.

### Features
**Sort:** When you click the label of column or row, the matrix will automatically sort in ascending order. Keep clicking to toggle between ascending, descending, and the original data order.

**Adjustable level:** By dragging the slider, you can change the threshold value for segmenting the above/below range, and bubbles reflect the change in real-time.

**Highlight:** If you click on a bubble, it gets highlighted with an annotation on the side detailing row, column and value. You can set different rules to highlight unusual values automatically.

**Auto-fit:** The bubble radius shrinks along with the available width and height until it reaches 25px then the matrix becomes scrollable. It is very useful when you have too many rows/columns or try to fit the visualization into a limited space. This effect can be simulated by adjusting the width and height using the sliders in the demo below.

For live demos and sample codes, please see [Bubble Matrix](https://observablehq.com/@analyzer2004/bubble-matrix)

<img src="https://github.com/analyzer2004/bubblematrix/blob/master/images/cover.png" width="768">

## API Reference
* **BubbleMatrix(container)** - Constructs a new instance of BubbleMatrix with default settings. The container is usually a DIV by can be any DOM element as well.
* **size([width, height])** - Sets the dimensions to specified width and height and returns this chart.
* **options(options)** - Overrides the default options and returns this chart.
  * options.**numberIsPercentage** - a boolean value that indicates whether the number is percentage. Default is false.  
  * options.**preserveRowOrder** - a boolean value that indicates whether the original order of the row should be preserved (for example: month). Default is false.  
  * options.**preserveColumnOrder** - a boolean value that indicates whether the original order of the column should be preserved. Default is false.  
  * options.**showSlider** - specifies whether the slider is enabled.
  * options.**sliderCaption** - sets the caption of slider. Default is "Value".
  * options.**highlightScope** - sets the highlight scope to *"matrix"*, *"byRow"*, *"top"* or *"bottom"*. Default is "matrix".
  * options.**numberOfTopBottom** - an integer value that indicates the number of bubbles should be highlighted when the **highlightScope** sets to *"top"* or *"bottom"*. Default is 5.
  * options.**showTooltip** - specifies whether the tooptip is enabled.
* **colors(colors)** - Overrides the color settings and returns this chart.
  * color.**row** - sets the background color of legend.
  * color.**above** - sets the color of bubbles which value is above the standard.
  * color.**below** - sets the color of bubbles which value is below the standard.
  * color.**label** - sets the color of labels.
* **columns(columns)** - Specifies the column names for each axis and return this chart.
  * columns.**row** - sets the column name for row axis.
  * columns.**column** - sets the column name for column axis.
  * columns.**value** - sets the column name for value.
* **font(font)** - Overrides the default font settings and returns this chart.
  * font.**fontFamily** - sets the font.
  * font.**size** - sets the font size of labels. Default is ***9***.
* **data(_)** - Sets the dataset and return this chart.
* **events(events)** -
  * events.**onclick** - occurs when click a bubble. 
  * events.**onhover** - occurs when hovers over a bubble.
  * events.**oncancel** - occurs when pointer leaves over a bubble.
* **render()** - Renders the visualization and returns this chart.