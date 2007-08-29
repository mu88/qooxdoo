/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2007 1&1 Internet AG, Germany, http://www.1and1.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/* ************************************************************************

#module(html)

************************************************************************ */

/**
 * High-performance, high-level DOM element creation and managment.
 *
 * Includes support for HTML and style attributes. Allows to
 * add children or to apply text or HTML content.
 *
 * Processes DOM insertion and modification based on the concept
 * of edit distance in an optimal way. This means that operations
 * on visible DOM nodes will be reduced at all needs.
 */
qx.Class.define("qx.html.Element",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a new Element
   *
   * @param domEl {Element?} an existing and visible DOM element
   */
  construct : function(domEl)
  {
    this.base(arguments);

    this.__children = [];
    
    this.__attribCache = {};
    this.__styleCache = {};
    
    this.__jobs = {};
    this.__attribJobs = {};
    this.__styleJobs = {};
    
    this.setAttribute("hashCode", this.toHashCode());

    if (domEl != null) {
      this.setDomElement(domEl);
    }
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      STATIC DATA
    ---------------------------------------------------------------------------
    */
    
    __debug : true,
    
    
    
    
    
    /*
    ---------------------------------------------------------------------------
      QUEUE MANAGMENT
    ---------------------------------------------------------------------------
    */

    __queue : [],


    /**
     * Adds the given element to the queue.
     *
     * @type static
     * @param element {qx.html.Element} Add the element to the global queue
     */
    addToQueue : function(element)
    {
      if (!element.__queued)
      {
        // console.debug("Add to queue object[" + element.toHashCode() + "]");
        this.__queue.push(element);
        element.__queued = true;
      }
    },


    /**
     * Removes the given element from the queue.
     *
     * @type static
     * @param element {qx.html.Element} Remove the element from the global queue
     */
    removeFromQueue : function(element)
    {
      if (element.__queued)
      {
        // console.debug("Remove from queue object[" + element.toHashCode() + "]");
        this.__queue.remove(element);
        delete element.__queued;
      }
    },






    /*
    ---------------------------------------------------------------------------
      ELEMENT QUEUE FLUSH
    ---------------------------------------------------------------------------
    */
    
    __flushElement : function(obj)
    {
      var isNew = !obj.__rendered;
      
      // console.debug("Flush element: " + obj + " (" + isNew + ")");
      
      if (isNew) 
      {
        this.__copyData(obj); 
        this.__insertChildren(obj);
      }
      else
      {
        this.__syncData(obj);
        this.__syncChildren(obj);
      }
      
      obj.__rendered = true;
    },
    
    
    
    
    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR ATTRIBUTE/STYLE/EVENT FLUSH
    ---------------------------------------------------------------------------
    */
        
    __copyData : function(obj)
    {
      var elem = obj.__element;
      
      var Attribute = qx.bom.element.Attribute;
      var Style = qx.bom.element.Style;
      
      // Copy attributes
      var data = obj.__attribCache;
      for (var key in data) {
        Attribute.set(elem, key, data[key]);
      }
      
      // Copy styles
      var data = obj.__styleCache;
      for (var key in data) {
        Style.set(elem, key, data[key]);
      }
    },
    
    
    __syncData : function(obj)
    {
      var elem = obj.__element;
      
      var Attribute = qx.bom.element.Attribute;
      var Style = qx.bom.element.Style;
      
      // Copy attributes
      var data = obj.__attribCache;
      var jobs = obj.__attribJobs;
      for (var key in jobs) {
        Attribute.set(elem, key, data[key]);
      }
      
      // Copy styles
      var data = obj.__styleCache;
      var jobs = obj.__styleJobs;
      for (var key in data) {
        Style.set(elem, key, data[key]);
      }
      
      // Cleanup jobs
      this.__attribJobs = {};
      this.__styleJobs = {};
    },
    
    
    
    
    
    
    /*
    ---------------------------------------------------------------------------
      SUPPORT FOR CHILDREN FLUSH
    ---------------------------------------------------------------------------
    */    
    
    __insertChildren : function(obj)
    {
      var domElement = obj.__element;
      
      for (var i=0, children=obj.__children, l=children.length; i<l; i++) 
      {
        if (children[i].__element) {
          domElement.appendChild(children[i].__element);
        }
      }
    },
    

    /**
     * Internal helper to apply the DOM structure of the
     * defined children.
     *
     * @type static
     * @param obj {qx.html.Element} the element to flush
     */
    __syncChildren : function(obj)
    {
      // **********************************************************************
      //   Compute needed operations
      // **********************************************************************
      
      // Collect all element nodes of the children data
      var target = [];

      for (var i=0, a=obj.__children, l=a.length; i<l; i++)
      {
        // Be sure that all children are created
        if (!a[i].__element) {
          a[i].__create();
        }

        // Push them into the target element
        target.push(a[i].__element);
      }

      var domElement = obj.__element;
      var source = domElement.childNodes;

      // Compute edit operations
      var operations = qx.util.EditDistance.getEditOperations(source, target);

      /*
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        // We need to convert the collection to an array otherwise
        // FireBug sometimes will display a live view of the DOM and not the
        // the snapshot at this moment.
        source = qx.lang.Array.fromCollection(source);
        
        console.log("Source: ", source.length + ": ", source);
        console.log("Target: ", target.length + ": ", target);
        console.log("Operations: ", operations);
      }
      */



      // **********************************************************************
      //   Process operations
      // **********************************************************************
      var job;
      var domOperations = 0;

      // Store offsets which are a result of element moves
      var offsets = [];

      for (var i=0, l=operations.length; i<l; i++)
      {
        job = operations[i];



        // ********************************************************************
        //   Apply offset
        // ********************************************************************
        if (offsets[job.pos] !== undefined)
        {
          job.pos -= offsets[job.pos];

          // We need to be sure that we don't get negative indexes.
          // This will otherwise break array/collection index access.
          if (job.pos < 0) {
            job.pos = 0;
          }
        }



        // ********************************************************************
        //   Process DOM
        // ********************************************************************
        if (job.operation === qx.util.EditDistance.OPERATION_DELETE)
        {
          // Ignore elements which are not placed at their original position anymore.
          if (domElement.childNodes[job.pos] === job.old)
          {
            // console.log("Remove: ", job.old);
            domElement.removeChild(job.old);
          }
        }
        else
        {
          // Operations: insert and replace
          // ******************************************************************
          //   Offset calculation
          // ******************************************************************
          // Element will be moved around in the same parent
          // We use the element on its old position and scan
          // to the begin. A counter will increment on each
          // step.
          //
          // This way we get the index of the element
          // from the beginning.
          //
          // After this we increment the offset of all affected
          // children (the following ones) until we reached the
          // current position in our operation queue. The reason
          // we stop at this point is that the following
          // childrens should already be placed correctly through
          // the operation method from the end to begin of the
          // edit distance algorithm.
          if (job.value.parentNode === domElement)
          {
            // find the position/index where the element is stored currently
            previousIndex = -1;
            iterator = job.value;

            do
            {
              previousIndex++;
              iterator = iterator.previousSibling;
            }
            while (iterator);

            // increment all affected offsets
            for (var j=previousIndex+1; j<=job.pos; j++)
            {
              if (offsets[j] === undefined) {
                offsets[j] = 1;
              } else {
                offsets[j]++;
              }
            }
          }



          // ******************************************************************
          //   The real DOM work
          // ******************************************************************
          if (job.operation === qx.util.EditDistance.OPERATION_REPLACE)
          {
            if (domElement.childNodes[job.pos] === job.old)
            {

              // console.log("Replace: ", job.old, " with ", job.value);
              domOperations++;

              domElement.replaceChild(job.value, job.old);
            }
            else
            {
              // console.log("Pseudo replace: ", job.old, " with ", job.value);
              job.operation = qx.util.EditDistance.OPERATION_INSERT;
            }
          }

          if (job.operation === qx.util.EditDistance.OPERATION_INSERT)
          {
            var before = domElement.childNodes[job.pos];

            if (before)
            {
              // console.log("Insert: ", job.value, " at: ", job.pos);
              domElement.insertBefore(job.value, before);
              domOperations++;
            }
            else
            {
              // console.log("Append: ", job.value);
              domElement.appendChild(job.value);
              domOperations++;
            }
          }
        }
      }



      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this.__debug) {
          console.debug("      - " + domOperations + " DOM operations made");
        }
      }
    },


    /**
     * Flush the global queue for all existing element needs
     *
     * @type static
     */
    flushQueue : function()
    {
      if (this.__inFlushQueue) {
        return;
      }


      // Block repeated flush calls
      this.__inFlushQueue = true;


      // Localize queue and create a new one
      var queue = this.__queue;
      
      // Block queue (should produce errors)
      this._queue = null;

      
      // User feedback
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this.__debug) {
          console.debug("Incoming queue has " + queue.length + " entries. Processing children...");
        }
      }
      
      
      // Be sure that all elements in the queue
      // and all their visible children
      var queuePos = 0;
      var queueLength = queue.length;
      var elemObj;
      
      // Continue running (while children were added)
      while(queuePos < queueLength)
      {
        // console.debug("Running: " + queuePos + " < " + queueLength);
        
        for (; queuePos<queueLength; queuePos++)
        {
          elemObj = queue[queuePos];
          
          if (elemObj.isLogicallyVisible())
          {
            // Create DOM element
            if (!elemObj.__element) {
              elemObj.__create();
            }
              
            // Add logically visible children to the queue
            children = elemObj.__children;
            if (children)
            {
              childrenLength = children.length;
              for (var j=0; j<childrenLength; j++)
              {
                if (children[j].isLogicallyVisible()) {
                  queue.push(children[j]);
                }
              }
            }
          }
        }
        
        queueLength = queue.length;
      }



      // User feedback
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this.__debug) {
          console.debug("Final queue has " + queue.length + " entries. Flushing...");
        }
      }
      
      
      
      // Split queue into two groups: rendered and not rendered 
      var renderedObjs = [];
      var invisibleObjs = [];

      var queueLength = queue.length;
      for (var queuePos=0; queuePos<queueLength; queuePos++)
      {
        elemObj = queue[queuePos];
        
        if (elemObj.__rendered) {
          renderedObjs.push(elemObj);
        } else {
          invisibleObjs.push(elemObj);
        }
      }
      
      
      // User feedback
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this.__debug) 
        {
          console.debug("Syncing " + invisibleObjs.length + " invisible elements...");
        }
      }
      
      for (var i=0; i<invisibleObjs.length; i++)
      {
        qx.html.Element.__flushElement(invisibleObjs[i]);
      }
      
      
      // User feedback
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        if (this.__debug) 
        {
          console.debug("Syncing " + renderedObjs.length + " rendered elements...");
        }
      }      
      
      for (var i=0; i<renderedObjs.length; i++)
      {
        qx.html.Element.__flushElement(renderedObjs[i]);
      }      
   
      
      
      // Free queue
      this._queue = [];
      
      
      // Remove process flag
      delete this.__inFlushQueue;
    }
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */    
    
    __nodeName : "div",
    __element : null,


    /**
     * Internal helper to generate the DOM element
     *
     * @type member
     */
    __create : function() 
    {
      this.__element = qx.bom.Element.create(this.__nodeName);
      this.__element.QxElement = this;
    },


    /**
     * Internal helper for all children addition needs
     *
     * @type member
     * @param child {var} the element to add
     * @throws an exception if the given element is already a child
     *     of this element
     */
    __addChildHelper : function(child)
    {
      if (child.__parent === this) {
        return;
      }

      // Remove from previous parent
      if (child.__parent) {
        child.__parent.remove(child);
      }

      // Convert to child of this object
      child.__parent = this;

      // Parent should remember job when already created
      if (this.__element) 
      {
        this.__jobs.children = true;
        qx.html.Element.addToQueue(this);
      }
    },


    /**
     * Internal helper for all children removal needs
     *
     * @type member
     * @param child {qx.html.Element} the removed element
     * @throws an exception if the given element is not a child
     *     of this element
     */
    __removeChildHelper : function(child)
    {
      if (child.__parent !== this) {
        throw new Error("Has no child: " + child);
      }

      // Parent should remember job when already created
      if (this.__element) 
      {
        this.__jobs.children = true;
        qx.html.Element.addToQueue(this);
      }

      // Remove reference to old parent
      delete child.__parent;
    },









    /*
    ---------------------------------------------------------------------------
      ELEMENT STATUS
    ---------------------------------------------------------------------------
    */
    
    /**
     * TODOC
     *
     * @type member
     * @return {Boolean} whether the element is visible / rendered.
     */
    isLogicallyVisible : function()
    {
      var elem = this;

      do
      {
        if (elem.__rendered) {
          return true; 
        }

        elem = elem.__parent;
      }
      while (elem);
      
      return false;
    },
    
    
    isPhysicallyVisible : function()
    {
      return this.__rendered;  
    },






    /*
    ---------------------------------------------------------------------------
      HIERACHY SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Returns a copy of the internal children structure.
     *
     * @type member
     * @return {Array} the children list
     */
    getChildren : function()
    {
      // protect structure using a copy
      return qx.lang.Array.copy(this.__children);
    },


    /**
     * Find the position of the given child
     *
     * @type member
     * @param child {qx.html.Element} the child
     * @return {Integer} returns the position. If the element
     *     is not a child <code>-1</code> will be returned.
     */
    indexOf : function(child) {
      return this.__children.indexOf(child);
    },








    /*
    ---------------------------------------------------------------------------
      CHILDREN MANAGEMENT
    ---------------------------------------------------------------------------
    */
    
    /**
     * Append the given child at the end of this element's children.
     *
     * @type member
     * @param child {qx.html.Element} the element to insert
     * @return {qx.html.Element} this object (for chaining support)
     */
    add : function(child)
    {
      this.__addChildHelper(child);
      this.__children.push(child);

      return this;
    },


    /**
     * Add all given children to this element
     *
     * @type member
     * @param varargs {arguments} the elements to add
     * @return {qx.html.Element} this object (for chaining support)
     */
    addList : function(varargs)
    {
      for (var i=0, l=arguments.length; i<l; i++) {
        this.add(arguments[i]);
      }

      return this;
    },


    /**
     * Inserts the given element after the given child.
     *
     * @type member
     * @param child {qx.html.Element} the element to insert
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertAfter : function(child, rel)
    {
      this.__addChildHelper(child);
      qx.lang.Array.insertAfter(this.__children, child, rel);

      return this;
    },


    /**
     * Inserts the given element before the given child.
     *
     * @type member
     * @param child {qx.html.Element} the element to insert
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertBefore : function(child, rel)
    {
      this.__addChildHelper(child);
      qx.lang.Array.insertBefore(this.__children, child, rel);

      return this;
    },


    /**
     * Inserts a new element at the given position
     *
     * @type member
     * @param child {qx.html.Element} the element to insert
     * @param index {Integer} the index (starts at 0 for the
     *     first child) to insert (the index of the following
     *     children will be increased by one)
     * @return {qx.html.Element} this object (for chaining support)
     */
    insertAt : function(child, index)
    {
      this.__addChildHelper(child);
      qx.lang.Array.insertAt(this.__children, child, index);

      return this;
    },


    /**
     * Remove the given child from this element.
     *
     * @type member
     * @param child {qx.html.Element} The child to remove
     * @return {qx.html.Element} the removed element
     */
    remove : function(child)
    {
      this.__removeChildHelper(child);
      return qx.lang.Array.remove(this.__children, child);
    },


    /**
     * Remove the child at the given index from this element.
     *
     * @type member
     * @param index {Integer} the position of the
     *     child (starts at 0 for the first child)
     * @return {qx.html.Element} the removed element
     */
    removeAt : function(index)
    {
      this.__removeChildHelper(child);
      return qx.lang.Array.removeAt(this.__children, index);
    },


    /**
     * Remove all given children from this element
     *
     * @type member
     * @param varargs {arguments} the elements
     * @return {qx.html.Element} this object (for chaining support)
     */
    removeList : function(varargs)
    {
      for (var i=0, l=arguments.length; i<l; i++) {
        this.remove(arguments[i]);
      }

      return this;
    },


    /**
     * Move the given child to the given index. The index
     * of the child on this index (if so) and all following
     * siblings will be increased by one.
     *
     * @type member
     * @param child {var} the child to move
     * @param index {Integer} the index (starts at 0 for the first child)
     * @return {qx.html.Element} this object (for chaining support)
     * @throws an exception when the given element is not child
     *      of this element.
     */
    moveTo : function(child, index)
    {
      if (child.__parent !== this) {
        throw new Error("Has no child: " + child);
      }

      if (this.__element) {
        this.self(arguments).addToQueue(this);
      }

      var oldIndex = this.__children.indexOf(child);

      if (oldIndex === index) {
        throw new Error("Could not move to same index!");
      } else if (oldIndex < index) {
        index--;
      }

      qx.lang.Array.removeAt(this.__children, oldIndex);
      qx.lang.Array.insertAt(this.__children, child, index);

      return this;
    },


    /**
     * Move the given <code>child</code> before the child <code>rel</code>.
     *
     * @type member
     * @param child {qx.html.Element} the child to move
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    moveBefore : function(child, rel) {
      return this.moveTo(child, this.__children.indexOf(rel));
    },


    /**
     * Move the given <code>child</code> after the child <code>rel</code>.
     *
     * @type member
     * @param child {qx.html.Element} the child to move
     * @param rel {qx.html.Element} the related child
     * @return {qx.html.Element} this object (for chaining support)
     */
    moveAfter : function(child, rel) {
      return this.moveTo(child, this.__children.indexOf(rel) + 1);
    },








    /*
    ---------------------------------------------------------------------------
      DOM ELEMENT ACCESS
    ---------------------------------------------------------------------------
    */
    
    /**
     * Sets the element to an already existing node. It will be
     * assumed that this DOM element is already visible e.g.
     * like a normal displayed element in the document's body.
     *
     * @type member
     * @param elem {Element} the dom element to set
     * @return {void}
     * @throws TODOC
     */
    setDomElement : function(elem)
    {
      if (this.__element) {
        throw new Error("Elements could not be replaced!");
      }

      // Initialize based on given element
      this.__element = elem;
      
      // Mark as rendered
      this.__rendered = true;
    },


    /**
     * Returns the DOM element (if created). Please don't use this.
     * It is better to make all changes to the framework object itself (using
     * {@link #setText}, {@link #setHtml}, or manipulating the children), rather
     * than to the underying DOM element.
     *
     * @type member
     * @return {Element} the DOM element node
     * @throws an error if the element was not yet created
     */
    getDomElement : function()
    {
      if (!this.__element) {
        throw new Error("Element is not yet created!");
      }

      return this.__element;
    },
    
    
    
    
    
    
    
    /*
    ---------------------------------------------------------------------------
      STYLE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Set up the given style attribute
     *
     * @type member
     * @param key {String} the name of the style attribute
     * @param value {var} the value
     * @return {qx.html.Element} this object (for chaining support)
     */
    setStyle : function(key, value)
    {
      this.__styleCache[key] = value;
      
      if (this.__rendered) 
      {
        qx.html.Element.addToQueue(this);
        this.__styleJobs[key] = true;
      }
      
      return this;
    },


    /**
     * Get the value of the given style attribute.
     *
     * @type member
     * @param key {String} name of the style attribute
     * @return {var} the value of the style attribute
     */
    getStyle : function(key) {
      return this.__styleCache[key];
    },





    /*
    ---------------------------------------------------------------------------
      ATTRIBUTE SUPPORT
    ---------------------------------------------------------------------------
    */
    
    /**
     * Set up the given attribute
     *
     * @type member
     * @param key {String} the name of the attribute
     * @param value {var} the value
     * @return {qx.html.Element} this object (for chaining support)
     */
    setAttribute : function(key, value)
    {
      this.__attribCache[key] = value;
      
      if (this.__rendered) 
      {
        qx.html.Element.addToQueue(this);
        this.__attribJobs[key] = true;
      }
      
      return this;
    },


    /**
     * Get the value of the given attribute.
     *
     * @type member
     * @param key {String} name of the attribute
     * @return {var} the value of the attribute
     */
    getAttribute : function(key) {
      return this.__attribCache[key];
    }
  }
});
