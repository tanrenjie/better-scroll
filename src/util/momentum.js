export function momentum(current, start, time, lowerMargin, wrapperSize, options) {      // 现在位置， 初始位置， 滑动时间，最大滚动位置，包装元素宽高(关闭回弹动画则为0)，初始配置参数
  let distance = current - start                           // 获取滑动的距离
  let speed = Math.abs(distance) / time                    // 获取滑动的速度（滑动距离 / 滑动时间）

  let {deceleration, itemHeight, swipeBounceTime, wheel, swipeTime} = options           // 动画的减速度 = 0.001, 每列高度, 回弹整个动画时间 = 500, 是否为 picker 组件，动画时长 = 2500
  let duration = swipeTime                                 // 获取动画时长
  let rate = wheel ? 4 : 15                                // 获取动画速率

  let destination = current + speed / deceleration * (distance < 0 ? -1 : 1)    // 目标点 = 现在的位置 + (滑动速度 / 动画的减速度) * 滑动方向
  if (wheel && itemHeight) {                               // 如果是 picker 组件
    destination = Math.round(destination / itemHeight) * itemHeight             // 目标点 = round（目标点 / 每列高度） * 每列高度  --取整
  }

  if (destination < lowerMargin) {                         // 目标点超出最大滚动位置
    destination = wrapperSize ? lowerMargin - (wrapperSize / rate * speed) : lowerMargin    // 目标点 = 开启回弹动画 ？ 最大滚动位置 - （包装元素宽高 / 动画速率 * 滑动速度) : 最大滚动位置
    duration = swipeBounceTime                                                              // 动画时长 = 回弹整个动画时间
  } else if (destination > 0) {                            // 目标点超出最小滚动位置
    destination = wrapperSize ? wrapperSize / rate * speed : 0                              // 目标点 = 开启回弹动画 ？（包装元素宽高 / 动画速率 * 滑动速度) : 最小滚动位置
    duration = swipeBounceTime
  }

  return {                                                 // 返回目标点位置，动画时长
    destination: Math.round(destination),
    duration
  }
}
