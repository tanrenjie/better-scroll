import {
  hasPerspective,
  hasTransition,
  hasTransform,
  hasTouch,
  style,
  offset,
  addEvent,
  removeEvent,
  getRect
} from '../util/dom'

import { extend } from '../util/lang'

const DEFAULT_OPTIONS = {
  startX: 0,                                 // 横轴方向初始化位置。
  startY: 0,                                 // 纵轴方向初始化位置。
  scrollX: false,                            // 当设置为 true 的时候，可以开启横向滚动。
  scrollY: true,                             // 当设置为 true 的时候，可以开启纵向滚动。
  freeScroll: false,                         // 当设置为 true 的时候，可以不限方向滚动。
  directionLockThreshold: 5,                 // 当我们需要锁定只滚动一个方向的时候，我们在初始滚动的时候根据横轴和纵轴滚动的绝对值做差，当差值大于 directionLockThreshold 的时候来决定滚动锁定的方向。 --当设置 eventPassthrough 的时候，directionLockThreshold 设置无效，始终为 0。
  eventPassthrough: '',                      // 有时候我们使用 better-scroll 在某个方向模拟滚动的时候，希望在另一个方向保留原生的滚动（比如轮播图，我们希望横向模拟横向滚动，而纵向的滚动还是保留原生滚动，我们可以设置 eventPassthrough 为 vertical；相应的，如果我们希望保留横向的原生滚动，可以设置eventPassthrough为 horizontal）。--eventPassthrough 的设置会导致其它一些选项配置无效，需要小心使用它。
  click: false,                              // better-scroll 默认会阻止浏览器的原生 click 事件。当设置为 true，better-scroll 会派发一个 click 事件，派发的 event 参数会有一个私有属性 _constructed，值为 true。
  tap: false,                                // 当自定义 click 事件满足不了需求时，可以设置 tap 为 true，它会在区域被点击的时候派发一个 tap 事件。
  bounce: true,                              // 当滚动超过边缘的时候会有一小段回弹动画。设置为 true 则开启动画。
  bounceTime: 700,                           // 设置回弹动画的动画时长。
  momentum: true,                            // 当快速在屏幕上滑动一段距离的时候，会根据滑动的距离和时间计算出动量，并生成滚动动画。设置为 true 则开启动画。
  momentumLimitTime: 300,                    // 只有在屏幕上快速滑动的时间小于 momentumLimitTime，才能开启 momentum 动画。
  momentumLimitDistance: 15,                 // 只有在屏幕上快速滑动的距离大于 momentumLimitDistance，才能开启 momentum 动画。
  swipeTime: 2500,                           // 设置 momentum 动画的动画时长。
  swipeBounceTime: 500,                      // 设置当运行 momentum 动画时，超过边缘后的回弹整个动画时间。
  deceleration: 0.001,                       // 表示 momentum 动画的减速度。
  flickLimitTime: 200,                       // 有的时候我们要捕获用户的轻拂动作（短时间滑动一个较短的距离）。只有用户在屏幕上滑动的时间小于 flickLimitTime ，才算一次轻拂。
  flickLimitDistance: 100,                   // 只有用户在屏幕上滑动的距离小于 flickLimitDistance ，才算一次轻拂。
  resizePolling: 60,                         // 当窗口的尺寸改变的时候，需要对 better-scroll 做重新计算，为了优化性能，我们对重新计算做了延时。60ms 是一个比较合理的值。
  probeType: 0,                              // 有时候我们需要知道滚动的位置。当 probeType 为 1 的时候，会非实时（屏幕滑动超过一定时间后）派发scroll 事件；当 probeType 为 2 的时候，会在屏幕滑动的过程中实时的派发 scroll 事件；当 probeType 为 3 的时候，不仅在屏幕滑动的过程中，而且在 momentum 滚动动画运行过程中实时派发 scroll 事件。
  preventDefault: true,                      // 当事件派发后是否阻止浏览器默认行为。
  preventDefaultException: {                 // 不阻止浏览器默认行为的元素，可以用正则匹配元素，比如我们想配一个 class 名称为 test 的元素，那么配置规则为 {className:/(^|\s)test(\s|$)/}。
    tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
  },
  HWCompositing: true,                       // 是否开启硬件加速，开启它会在 scroller 上添加 translateZ(0) 来开启硬件加速从而提升动画性能，有很好的滚动效果。
  useTransition: true,                       // 是否使用 CSS3 transition 动画。如果设置为 false，则使用 requestAnimationFrame 做动画。
  useTransform: true,                        // 是否使用 CSS3 transform 做位移。如果设置为 false, 则设置元素的 top/left (这种情况需要 scroller 是绝对定位的)。
  bindToWrapper: false,                      // move 事件通常会绑定到 document 上而不是滚动的容器上，当移动的过程中光标或手指离开滚动的容器滚动仍然会继续，这通常是期望的。当然你也可以把 move 事件绑定到滚动的容器上，bindToWrapper 设置为 true 即可，这样一旦移动的过程中光标或手指离开滚动的容器，滚动会立刻停止。
  disableMouse: hasTouch,                    // 当在移动端环境（支持 touch 事件），disableMouse 会计算为 true，这样就不会监听鼠标相关的事件。
  disableTouch: !hasTouch,                   // 当在 PC 端环境，disableMouse 会计算为 true，这样就不会监听 touch 相关的事件。
  /**
   * for picker
   * wheel: {
   *   selectedIndex: 0,
   *   rotate: 25,
   *   adjustTime: 400
   * }
   */
  wheel: false,                              // 这个配置是为了做 picker 组件用的，默认为 false，如果开启则需要配置一个 Object。
  /**
   * for slide
   * snap: {
   *   loop: false,
   *   el: domEl,
   *   threshold: 0.1,
   *   stepX: 100,
   *   stepY: 100,
   *   listenFlick: true
   * }
   */
  snap: false,                               // 这个配置是为了做 slide 组件用的，默认为 false，如果开启则需要配置一个 Object。
  /**
   * for scrollbar
   * scrollbar: {
   *   fade: true
   * }
   */
  scrollbar: false,                          // 这个配置可以开启滚动条，默认为 false。当设置为 true 或者是一个 Object 的时候，都会开启滚动条。
  /**
   * for pull down and refresh
   * pullDownRefresh: {
   *   threshold: 50,
   *   stop: 20
   * }
   */
  pullDownRefresh: false,                    // 这个配置用于做下拉刷新功能，默认为 false。当设置为 true 或者是一个 Object 的时候，可以开启下拉刷新，可以配置顶部下拉的距离（threshold） 来决定刷新时机以及回弹停留的距离（stop）。
  /**
   * for pull up and load
   * pullUpLoad: {
   *   threshold: 50
   * }
   */
  pullUpLoad: false                          // 这个配置用于做上拉加载功能，默认为 false。当设置为 true 或者是一个 Object 的时候，可以开启上拉加载，可以配置离底部距离阈值（threshold）来决定开始加载的时机。
}

export function initMixin(BScroll) {
  BScroll.prototype._init = function (el, options) {
    this._handleOptions(options)

    // init private custom events
    this._events = {}

    this.x = 0
    this.y = 0
    this.directionX = 0
    this.directionY = 0

    this._addDOMEvents()

    this._initExtFeatures()

    this.refresh()

    if (!this.options.snap) {
      this.scrollTo(this.options.startX, this.options.startY)
    }

    this.enable()
  }

  BScroll.prototype._handleOptions = function (options) {               // 处理配置参数
    this.options = extend({}, DEFAULT_OPTIONS, options)

    this.translateZ = this.options.HWCompositing && hasPerspective ? ' translateZ(0)' : ''      // 当配置参数开启硬件加速且有此属性

    this.options.useTransition = this.options.useTransition && hasTransition
    this.options.useTransform = this.options.useTransform && hasTransform

    this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault

    // 根据 eventPassthrough 值决定横纵向滚动失效
    this.options.scrollX = this.options.eventPassthrough === 'horizontal' ? false : this.options.scrollX
    this.options.scrollY = this.options.eventPassthrough === 'vertical' ? false : this.options.scrollY

    // 而且 freeScroll、directionLockThreshold 的值也取决于 eventPassthrough
    this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough
    this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold

    if (this.options.tap === true) {
      this.options.tap = 'tap'
    }
  }

  BScroll.prototype._addDOMEvents = function () {
    let eventOperation = addEvent
    this._handleDOMEvents(eventOperation)
  }

  BScroll.prototype._removeDOMEvents = function () {
    let eventOperation = removeEvent
    this._handleDOMEvents(eventOperation)
  }

  BScroll.prototype._handleDOMEvents = function (eventOperation) {              // 管理dom事件
    let target = this.options.bindToWrapper ? this.wrapper : window             // 根据配置参数判断，绑定到对应元素或window
    eventOperation(window, 'orientationchange', this)                           // 绑定手机横竖屏事件
    eventOperation(window, 'resize', this)

    if (this.options.click) {
      eventOperation(this.wrapper, 'click', this, true)
    }

    if (!this.options.disableMouse) {
      eventOperation(this.wrapper, 'mousedown', this)
      eventOperation(target, 'mousemove', this)
      eventOperation(target, 'mousecancel', this)
      eventOperation(target, 'mouseup', this)
    }

    if (hasTouch && !this.options.disableTouch) {
      eventOperation(this.wrapper, 'touchstart', this)
      eventOperation(target, 'touchmove', this)
      eventOperation(target, 'touchcancel', this)
      eventOperation(target, 'touchend', this)
    }

    eventOperation(this.scroller, style.transitionEnd, this)
  }

  BScroll.prototype._initExtFeatures = function () {
    if (this.options.snap) {
      this._initSnap()
    }
    if (this.options.scrollbar) {
      this._initScrollbar()
    }
    if (this.options.pullUpLoad) {
      this._initPullUp()
    }
  }

  BScroll.prototype.handleEvent = function (e) {
    switch (e.type) {
      case 'touchstart':
      case 'mousedown':
        this._start(e)
        break
      case 'touchmove':
      case 'mousemove':
        this._move(e)
        break
      case 'touchend':
      case 'mouseup':
      case 'touchcancel':
      case 'mousecancel':
        this._end(e)
        break
      case 'orientationchange':
      case 'resize':
        this._resize()
        break
      case 'transitionend':
      case 'webkitTransitionEnd':
      case 'oTransitionEnd':
      case 'MSTransitionEnd':
        this._transitionEnd(e)
        break
      case 'click':
        if (this.enabled && !e._constructed) {
          e.preventDefault()
          e.stopPropagation()
        }
        break
    }
  }

  BScroll.prototype.refresh = function () {                         // 刷新BScroll,切换横竖屏或者内容/浏览器宽高变化时手动调用
    let wrapperRect = getRect(this.wrapper)
    this.wrapperWidth = wrapperRect.width
    this.wrapperHeight = wrapperRect.height

    let scrollerRect = getRect(this.scroller)
    this.scrollerWidth = scrollerRect.width
    this.scrollerHeight = scrollerRect.height

    const wheel = this.options.wheel
    if (wheel) {                                     // 当用于 picker 时
      this.items = this.scroller.children
      this.options.itemHeight = this.itemHeight = this.items.length ? this.scrollerHeight / this.items.length : 0
      if (this.selectedIndex === undefined) {       // 更新索引及起始位置
        this.selectedIndex = wheel.selectedIndex
      }
      this.options.startY = -this.selectedIndex * this.itemHeight
      this.maxScrollX = 0
      this.maxScrollY = -this.itemHeight * (this.items.length - 1)
    } else {                                        // 更新最大滚动值
      this.maxScrollX = this.wrapperWidth - this.scrollerWidth
      this.maxScrollY = this.wrapperHeight - this.scrollerHeight
    }

    this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0
    this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0

    if (!this.hasHorizontalScroll) {                            // 滚动元素内容宽度未超出父级元素宽度
      this.maxScrollX = 0
      this.scrollerWidth = this.wrapperWidth
    }

    if (!this.hasVerticalScroll) {                              // 滚动元素内容高度未超出父级元素高度
      this.maxScrollY = 0
      this.scrollerHeight = this.wrapperHeight
    }

    this.endTime = 0                                            // 重置参数，启动过渡动画
    this.directionX = 0
    this.directionY = 0
    this.wrapperOffset = offset(this.wrapper)

    this.trigger('refresh')

    this.resetPosition()
  }

  BScroll.prototype.enable = function () {                  // scroll 处于启用状态
    this.enabled = true
  }

  BScroll.prototype.disable = function () {                 // scroll 处于禁用状态
    this.enabled = false
  }
}
