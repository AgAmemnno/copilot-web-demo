# web-components-examples
A series of Web Components examples, related to the MDN Web Components documentation at https://developer.mozilla.org/en-US/docs/Web/API/Web_components.

> Please refer to our [contribution guidelines](https://github.com/mdn/web-components-examples/blob/main/CONTRIBUTING.md) before contributing.

The following examples are available:

* [composed-composed-path](composed-composed-path). A very simple example that shows the behavior of the <code>Event</code> object <code>composed</code> and <code>composedPath</code> properties. [See composed-composed-path live](https://mdn.github.io/web-components-examples/composed-composed-path/).
* [defined-pseudo-class](defined-pseudo-class). A very simple example that shows how the <code>[:defined pseudo-class](https://developer.mozilla.org/en-US/docs/Web/CSS/:defined)</code> works. [See defined-pseudo-class live](https://mdn.github.io/web-components-examples/defined-pseudo-class/).
* [editable-list](editable-list) – <code>&lt;editable-list&gt;</code>.  A simple example showing how elements can be consolidated to create a list with addable/removable items.  Items are added by using a `list-item` attribute or by entering text and clicking the plus sign. [See editable-list live](https://mdn.github.io/web-components-examples/editable-list/).
* [edit-word](edit-word) — <code>&lt;edit-word&gt;</code>. Wrapping one or more words in this element means that you can then click/focus the element to reveal a text input that can then be used to edit the word(s). [See edit-word live](https://mdn.github.io/web-components-examples/edit-word/).
* [element-details](element-details) — <code>&lt;element-details&gt;</code>. Displays a box containing an HTML element name and description. Provides an example of an autonomous custom element that gets its structure from a <code>&lt;template&gt;</code> element (that also has its own styling defined), and also contains <code>&lt;slot&gt;</code> elements populated at runtime. [See element-details live](https://mdn.github.io/web-components-examples/element-details/).
* [expanding-list-web-component](expanding-list-web-component) — <code>&lt;ul is="expanding-list"&gt;</code>. Creates an unordered list with expandable/collapsible children. Provides an example of a customized built-in element (the class inherits from <code>HTMLUListElement</code> rather than <code>HTMLElement</code>). [See expanding-list live](https://mdn.github.io/web-components-examples/expanding-list-web-component/).
* [life-cycle-callbacks](life-cycle-callbacks) — <code>&lt;custom-square l="" c=""&gt;</code>. A trivial example web component that creates a square colored box on the page. The demo also includes buttons to create, destroy, and change attributes on the element, to demonstrate how the [web components life cycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks) work [See life-cycle-callbacks live](https://mdn.github.io/web-components-examples/life-cycle-callbacks/).
* [popup-info-box-web-component](popup-info-box-web-component) — <code>&lt;popup-info img="" text=""&gt;</code>. Creates an info icon that when focused displays a popup info box. Provides an example of an autonomous custom element that takes information from its attributes, and defines structure and basic style in an attached shadow DOM. [See popup-info-box live](https://mdn.github.io/web-components-examples/popup-info-box-web-component/).
* [simple-template](simple-template) — A very simple trivial example that quickly demonstrates usage of the <code>&lt;template&gt;</code> and <code>&lt;slot&gt;</code> elements. [See simple-template live](https://mdn.github.io/web-components-examples/simple-template/).
* [slotchange example](slotchange) — <code>&lt;summary-display&gt;</code>. An example that takes as its two slot values a list of possible choices, and a description for the selected choice. Multiple paragraphs are included inside the element containing all the possible descriptions; when a choice is clicked, its corresponding description paragraph is given an appropriate slot attribute so that it appears in the second slot. This example is written to demonstrate usage of the slotchange attribute, and features of the HTMLSlotElement interface [See the slotchange example live](https://mdn.github.io/web-components-examples/slotchange).
* [slotted-pseudo-element](slotted-pseudo-element). A very simple example that shows how the <code>::slotted</code> pseudo-element works. [See slotted-pseudo-element live](https://mdn.github.io/web-components-examples/slotted-pseudo-element/).
* [word-count-web-component](word-count-web-component) — <code>&lt;word-count&gt;</code>. When added to an element, counts all the words inside that element and displays them inside an attached shadow DOM. It also contains an interval that periodically updates the word count as it changes. Provides an example of a customized built-in element (the class inherits from <code>HTMLParagraphElement</code> rather than <code>HTMLElement</code>). [See word-count live](https://mdn.github.io/web-components-examples/word-count-web-component/).

## Custom Elements

The following custom elements are defined in this repository:

* `open-shadow` (defined in [composed-composed-path/main.js](composed-composed-path/main.js)): A custom element with an open shadow DOM.
* `closed-shadow` (defined in [composed-composed-path/main.js](composed-composed-path/main.js)): A custom element with a closed shadow DOM.
* `simple-custom` (defined in [defined-pseudo-class/main.js](defined-pseudo-class/main.js)): A simple custom element with a shadow DOM.
* `person-details` (defined in [edit-word/main.js](edit-word/main.js)): A custom element that displays personal details using slots.
* `edit-word` (defined in [edit-word/main.js](edit-word/main.js)): A custom element that allows editing of words by clicking on them.
* `editable-list` (defined in [editable-list/main.js](editable-list/main.js)): A custom element that creates a list with addable/removable items.
* `element-details` (defined in [element-details/main.js](element-details/main.js)): A custom element that displays an element's details using a template and slots.
* `expanding-list` (defined in [expanding-list-web-component/main.js](expanding-list-web-component/main.js)): A custom element that creates an expandable/collapsible list.
* `context-span` (defined in [host-selectors/main.js](host-selectors/main.js)): A custom element that demonstrates the use of :host and :host-context selectors.
* `custom-square` (defined in [life-cycle-callbacks/main.js](life-cycle-callbacks/main.js)): A custom element that creates a square colored box and demonstrates lifecycle callbacks.
* `popup-info` (defined in [popup-info-box-external-stylesheet/main.js](popup-info-box-external-stylesheet/main.js) and [popup-info-box-web-component/main.js](popup-info-box-web-component/main.js)): A custom element that creates an info icon with a popup info box.
* `tabbed-custom-element` (defined in [shadow-part/main.js](shadow-part/main.js)): A custom element that creates a tabbed interface using shadow parts.
* `my-paragraph` (defined in [simple-template/main.js](simple-template/main.js)): A custom element that demonstrates the use of templates and slots.
* `summary-display` (defined in [slotchange/main.js](slotchange/main.js)): A custom element that displays a summary of selected items using slots and the slotchange event.
* `person-details` (defined in [slotted-pseudo-element/main.js](slotted-pseudo-element/main.js)): A custom element that displays personal details using slots and the ::slotted pseudo-element.
* `word-count` (defined in [word-count-web-component/main.js](word-count-web-component/main.js)): A custom element that counts and displays the number of words in its parent element.
