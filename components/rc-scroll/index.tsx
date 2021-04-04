import React, { Component } from "react";
import PropTypes from "prop-types";

export default class InfiniteScroll extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    element: PropTypes.node,
    hasMore: PropTypes.bool,
    initialLoad: PropTypes.bool,
    isReverse: PropTypes.bool,
    loader: PropTypes.node,
    loadMore: PropTypes.func.isRequired,
    pageStart: PropTypes.number,
    ref: PropTypes.func,
    getScrollParent: PropTypes.func,
    threshold: PropTypes.number,
    useCapture: PropTypes.bool,
    useWindow: PropTypes.bool,
  };

  static defaultProps = {
    element: "div",
    hasMore: false,
    initialLoad: true,
    pageStart: 0,
    ref: null,
    threshold: 250,
    useWindow: true,
    isReverse: false,
    useCapture: false,
    loader: null,
    getScrollParent: null,
  };

  constructor(props) {
    super(props);

    this.scrollListener = this.scrollListener.bind(this);
    this.eventListenerOptions = this.eventListenerOptions.bind(this);
    this.mousewheelListener = this.mousewheelListener.bind(this);
  }

  options:
    | {
        capture: boolean; // 是否捕捉
        passive: boolean; // 是否禁止 preventDefault
      }
    | boolean;
  scrollComponent: React.ReactNode; // 当前滚动的列表

  componentDidMount() {
    this.pageLoaded = this.props.pageStart;
    this.options = this.eventListenerOptions();
    this.attachScrollListener();
  }

  componentDidUpdate() {
    // 反向列表需要把滚动高度加回去
    if (this.props.isReverse && this.loadMore) {
      const parentElement = this.getParentElement(this.scrollComponent);
      // NOTE
      parentElement.scrollTop =
        parentElement.scrollHeight -
        this.beforeScrollHeight +
        this.beforeScrollTop;
      this.loadMore = false;
    }
    this.attachScrollListener();
  }

  componentWillUnmount() {
    this.detachScrollListener();
    this.detachMousewheelListener();
  }

  // 是否支持 addEventListener options 上的 passive 属性
  isPassiveSupported() {
    let passive = false;

    const testOptions = {
      get passive() {
        passive = true;
      },
    };

    try {
      document.addEventListener("test", null, testOptions);
      document.removeEventListener("test", null, testOptions);
    } catch (e) {
      // ignore
    }
    return passive;
  }

  // 生成 addEventListener 的 options
  eventListenerOptions(): boolean {
    let options = this.props.useCapture;

    if (this.isPassiveSupported()) {
      options = {
        useCapture: this.props.useCapture,
        passive: true,
      };
    } else {
      options = {
        passive: false,
      };
    }
    return options;
  }

  // Set a defaut loader for all your `InfiniteScroll` components
  setDefaultLoader(loader) {
    this.defaultLoader = loader;
  }

  detachMousewheelListener() {
    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = this.scrollComponent.parentNode;
    }

    scrollEl.removeEventListener(
      "mousewheel",
      this.mousewheelListener,
      this.options ? this.options : this.props.useCapture
    );
  }

  detachScrollListener() {
    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = this.getParentElement(this.scrollComponent);
    }

    scrollEl.removeEventListener(
      "scroll",
      this.scrollListener,
      this.options ? this.options : this.props.useCapture
    );
    scrollEl.removeEventListener(
      "resize",
      this.scrollListener,
      this.options ? this.options : this.props.useCapture
    );
  }

  // 放回当前元素的父级,或者当前getScrollParent返回的父级
  getParentElement(el) {
    const scrollParent =
      this.props.getScrollParent && this.props.getScrollParent();
    if (scrollParent != null) {
      return scrollParent;
    }
    return el && el.parentNode;
  }

  filterProps(props) {
    return props;
  }

  // 添加事件
  attachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent);

    // 没有更多 或者 没有父元素
    if (!this.props.hasMore || !parentElement) {
      return;
    }
    // 滚动事件元素
    let scrollEl = window;
    if (this.props.useWindow === false) {
      scrollEl = parentElement;
    }

    scrollEl.addEventListener(
      "mousewheel",
      this.mousewheelListener,
      this.options ? this.options : this.props.useCapture
    );
    scrollEl.addEventListener(
      "scroll",
      this.scrollListener,
      this.options ? this.options : this.props.useCapture
    );
    scrollEl.addEventListener(
      "resize",
      this.scrollListener,
      this.options ? this.options : this.props.useCapture
    );

    if (this.props.initialLoad) {
      this.scrollListener();
    }
  }

  mousewheelListener(e) {
    // Prevents Chrome hangups
    // See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    if (e.deltaY === 1 && !this.isPassiveSupported()) {
      e.preventDefault();
    }
  }

  // 滚动事件
  scrollListener() {
    const el = this.scrollComponent;
    const scrollEl = window;
    const parentNode = this.getParentElement(el);

    let offset;
    if (this.props.useWindow) {
      const doc =
        document.documentElement || document.body.parentNode || document.body;
      const scrollTop =
        scrollEl.pageYOffset !== undefined
          ? scrollEl.pageYOffset
          : doc.scrollTop;
      if (this.props.isReverse) {
        offset = scrollTop;
      } else {
        offset = this.calculateOffset(el, scrollTop);
      }
    } else if (this.props.isReverse) {
      offset = parentNode.scrollTop;
    } else {
      offset = el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight;
    }

    // Here we make sure the element is visible as well as checking the offset
    if (
      offset < Number(this.props.threshold) &&
      el &&
      el.offsetParent !== null
    ) {
      this.detachScrollListener();
      this.beforeScrollHeight = parentNode.scrollHeight;
      this.beforeScrollTop = parentNode.scrollTop;
      // Call loadMore after detachScrollListener to allow for non-async loadMore functions
      if (typeof this.props.loadMore === "function") {
        this.props.loadMore((this.pageLoaded += 1));
        this.loadMore = true;
      }
    }
  }

  // 计算offset
  calculateOffset(el, scrollTop): number {
    if (!el) {
      return 0;
    }

    return (
      this.calculateTopPosition(el) +
      (el.offsetHeight - scrollTop - window.innerHeight)
    );
  }

  // 递归计算元素高度
  calculateTopPosition(el): number {
    if (!el) {
      return 0;
    }
    return el.offsetTop + this.calculateTopPosition(el.offsetParent);
  }

  render() {
    const renderProps = this.filterProps(this.props);
    const {
      children,
      element,
      hasMore,
      initialLoad,
      isReverse,
      loader,
      loadMore,
      pageStart,
      ref,
      threshold,
      useCapture,
      useWindow,
      getScrollParent,
      ...props
    } = renderProps;

    props.ref = (node) => {
      this.scrollComponent = node;
      if (ref) {
        ref(node);
      }
    };

    const childrenArray = [children];
    if (hasMore) {
      // 向列表中添加一个 加载动画 元素
      if (loader) {
        isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader);
      } else if (this.defaultLoader) {
        isReverse
          ? childrenArray.unshift(this.defaultLoader)
          : childrenArray.push(this.defaultLoader);
      }
    }
    return React.createElement(element, props, childrenArray);
  }
}
