/***********************
    author : guanyuwei
    Date   : 2015.1.5
************************/

function $(sel) {return document.querySelector(sel)}
function $$(sel) {return document.querySelectorAll(sel)}

var TRANSFORM
var TRANSITIONDURATION
var ELEMENTSTYLE = document.createElement('div').style
  
void function(){
  var transform = ['t', 'webkitT', 'MozT', 'msT', 'OT']
  var i = 0
  var l = transform.length

  for ( ; i < l; i++ ) {
    TRANSFORM = transform[i] + 'ransform';
    
    if ( TRANSFORM in ELEMENTSTYLE ) {
      return transform[i].substr(0, transform[i].length-1);
    }
  }
}()
/* Pages */
var Pages = function(el, options) {
  var setting = options || {}

  this.swipe = setting.swipe || 'Y';
  this.minRange = setting.minRange || 48;
  this.duration = setting.duration || 0.3;
  this.autoPlay = setting.autoPlay;
  this.current = setting.current || 0;

  this.touching = false;
  this.flag = false
  this.moving = false

  this.height
  this.width
  this.pageX
  this.pageY

  this.$el = (typeof el==='string')?document.querySelector(el):el
  this.total    = this.$el.children.length - 1


  if(this.total < 1) return;

  this._init()
  this._bindEvents()
}

Pages.prototype._init = function() {
  var position
  var setter = this['set'+this.swipe]
  var current = this.current
  var pages = this.$el.children
  var count = pages.length
  var width = this.$el.parentNode.clientWidth
  var height = this.$el.parentNode.clientHeight

  var scale = height/504

  if(scale > 1) scale = 1

  this.width = width
  this.height = height
  position = this['X' === this.swipe? 'width': 'height']
  
  while (count) {
    --count
    
    if (current === count) {
      if(this.autoPlay) this._play(pages[count])
    } else {
      this.clearDuration(pages[count])
      setter(pages[count], count<current? -position: position)
    }

    pages[count].children[0].style.zoom = scale
  }

  document.body.scrollTop = 0
}

Pages.prototype._play = function(target, current) {
  setTimeout(function(){
    var $target = target.querySelector('.stage')
    var $current = current && current.querySelector('.stage')

    $target && ($target.style.display = 'block')
    $current  && ($current.style.display = 'none')
  }, this.duration * 1000)
}

Pages.prototype.play = function() {
  this._play(this.getCurrent())
}

Pages.prototype._bindEvents = function() {
  var events = [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
  ]

  window.addEventListener('resize', this, false)
  window.addEventListener('orientationchange', this, false)
  for (var i=0, l=events.length; i<l; i++) {
    this.$el.addEventListener(events[i], this, false)
  }
}

Pages.prototype.handleEvent = function(e) {
  var type = e.type
  switch (type) {
    case 'resize':
    case 'orientationchange':
      this._init(e)
      break
    case 'touchstart':
      this.start(e)
      break
    case 'touchmove':
      this.move(e)
      break
    case 'touchend':
    case 'touchcancel':
      this.end(e)
        break
    default:
      console.error(type)
      console.log(e)
  }
}

Pages.prototype.start = function(e) {
  if (this.touching) return

  var touches = e.type === 'touchstart'? e.touches[0]: e
  var current = this.getCurrent()
  var next = current.nextElementSibling
  var prev = current.previousElementSibling

  this.touching = true
  this.flag = null
  this.moving = 0

  this.pageX = touches.pageX
  this.pageY = touches.pageY
  current.style.zIndex = '1'

  if(next) {
    this.clearDuration(next)
    next.style.zIndex = null;
    this['set'+this.swipe](next, this.swipe === 'X'? this.width: this.height)
  }
  if(prev) {
    this.clearDuration(prev)
    prev.style.zIndex = null
    this['set'+this.swipe](prev, this.swipe === 'X'? -this.width: -this.height)
  }
}

Pages.prototype.move = function(e) {
  e.stopPropagation()
  e.preventDefault()

  if(!this.touching) return

  var touches = e.type === 'touchmove'? e.touches[0]: e
  var X = touches.pageX - this.pageX
  var Y = touches.pageY - this.pageY
  var current = this.getCurrent()
  var next = current.nextElementSibling
  var prev = current.previousElementSibling

  if(!this.flag) {
    this.flag = Math.abs(X) > Math.abs(Y) ? 'X' : 'Y'
    this.clearDuration(current, next, prev)
  }

  switch (this.swipe) {
    case 'X':
      this.moving = X

      this.setX(current, X)
      next && ( this.setX(next, X+this.width) )
      prev && ( this.setX(prev, X-this.width) )
      break;
    case 'Y':
      this.moving = Y;
      if( (this.current === 0 && Y>0) || (this.current === this.total && Y<0) ) return this.setY(current, Y/3);
      current.style[TRANSFORM+'Origin'] = '50% '+ (Y>0?'80%':'20%');
      current.style[TRANSFORM] = 'scale('+(1-Math.abs(Y)/this.height/3)+')';
      next && ( this.setY(next, Y+this.height) );
      prev && ( this.setY(prev, Y-this.height) );
  }
}

Pages.prototype.end = function(e) {
  var minRange = this.minRange
  var move = this.moving
  var current = this.getCurrent()
  var swipe = this.swipe
  var height = this.height
  var width = this.width
  var next = current.nextElementSibling
  var prev = current.previousElementSibling

  this.touching = false

  if (!this.flag) return
  
  if (move <- minRange && next) return this.next()
  if (move >  minRange && prev) return this.prev()
  
  this.setDuration(current, next, prev)
  this.setCurrent(current)
  prev && ( this['set'+swipe](prev, -(swipe === 'X'? width: height)) )
  next && ( this['set'+swipe](next,   swipe === 'X'? width: height)  )
}

Pages.prototype.getCurrent = function() {
  return this.$el.children[this.current]
}

Pages.prototype.clearDuration = function() {
  Array.prototype.forEach.call(arguments, function(el) {
    el && (el.style.webkitTransitionDuration = null)
  })
}

Pages.prototype.setDuration = function() {
  var duration = this.duration

  Array.prototype.forEach.call(arguments, function(el) {
    el && (el.style.webkitTransitionDuration = duration+'s')
  })
}

Pages.prototype.setX = function(el, x, unit) {
  el && (el.style[TRANSFORM] = 'translate3d('+x+(unit||'px')+',0,0)')
}

Pages.prototype.setY = function(el, y, unit) {
  el && (el.style[TRANSFORM] = 'translate3d(0,'+y+(unit||'px')+',0)')
}

Pages.prototype.setCurrent = function(el) {
  if(el.nodeType) el.style[TRANSFORM] = ''
}

Pages.prototype.next = function() {
  this.go(this.current+1)
}

Pages.prototype.prev = function() {
  this.go(this.current-1)
}

Pages.prototype.random = function() {
  var count = this.$el.children.length
  var current = this.current
  var arr = []
  var num

  for(var i=0; i<count; i++) {
    if(i!==current) arr.push(i.toString())
  }

  num = Math.floor(Math.random()*arr.length)
  this.go(+arr[num])
}

Pages.prototype.go = function(i) {
  var current = this.getCurrent()
  var total = this.$el.childElementCount
  var target = this.$el.children[i]
  //var d = i<this.current? -1: 1

  if (i === this.current || i<0 || i>total) return

  this.setDuration(current, target);
  current.style[TRANSFORM] = 'scale(.66)';
  this.setCurrent(target);
  this._play(target, current);
  this.current = i;
}