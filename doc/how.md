### 自动化遍历之分析UI树结构找到有意义的可点项

#### 导航
如何找到`navigationBar` `tabs`这些节点

- 从clickable节点集合，筛选出同级节点也是clickable的项
- 分析该集合坐标是否水平平行
- 分析该节点集合父节点、在整个屏幕的位置，占用高度


#### 内容
找到`ListView`、`GridView` 内容列表

- 一般来说内容块在UI的高度占比通常都是比较大
- 通过scrollable筛选出，可滚动集合A
- 从集合A中按高度找最大的那个

#### 详细页

- 内容块的子元素中筛选`clickable`的集合
- 找到同级节点也是`clickable`的节点
- 进入详细页后找`scrollable`
