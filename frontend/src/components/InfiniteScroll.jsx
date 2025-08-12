import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(Observer);

export default function InfiniteScroll({
  width = "30rem",
  maxHeight = "100%",
  negativeMargin = "-0.5em",
  items = [],
  itemMinHeight = 150,
  isTilted = false,
  tiltDirection = "left",
  autoplay = false,
  autoplaySpeed = 0.5,
  autoplayDirection = "down",
  pauseOnHover = false,
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);

  const getTiltTransform = () => {
    if (!isTilted) return "none";
    return tiltDirection === "left"
      ? "rotateX(20deg) rotateZ(-20deg) skewX(20deg)"
      : "rotateX(20deg) rotateZ(20deg) skewX(-20deg)";
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (items.length === 0) return;

    const divItems = gsap.utils.toArray(container.children);
    if (!divItems.length) return;

    const firstItem = divItems[0];
    const itemStyle = getComputedStyle(firstItem);
    
    // Check if we're doing horizontal or vertical scrolling
    const isHorizontal = autoplayDirection === "left" || autoplayDirection === "right";
    
    let itemDimension, totalDimension, wrapFn;
    
    if (isHorizontal) {
      const itemWidth = firstItem.offsetWidth;
      const itemMarginLeft = parseFloat(itemStyle.marginLeft) || 0;
      const totalItemWidth = itemWidth + itemMarginLeft;
      totalDimension = itemWidth * items.length + itemMarginLeft * (items.length - 1);
      wrapFn = gsap.utils.wrap(-totalDimension, totalDimension);
      
      divItems.forEach((child, i) => {
        const x = i * totalItemWidth;
        gsap.set(child, { x });
      });
    } else {
      const itemHeight = firstItem.offsetHeight;
      const itemMarginTop = parseFloat(itemStyle.marginTop) || 0;
      const totalItemHeight = itemHeight + itemMarginTop;
      totalDimension = itemHeight * items.length + itemMarginTop * (items.length - 1);
      wrapFn = gsap.utils.wrap(-totalDimension, totalDimension);
      
      divItems.forEach((child, i) => {
        const y = i * totalItemHeight;
        gsap.set(child, { y });
      });
    }

    const observer = Observer.create({
      target: container,
      type: "wheel,touch,pointer",
      preventDefault: true,
      onPress: ({ target }) => {
        target.style.cursor = "grabbing";
      },
      onRelease: ({ target }) => {
        target.style.cursor = "grab";
      },
      onChange: ({ deltaY, deltaX, isDragging, event }) => {
        const d = isHorizontal 
          ? (event.type === "wheel" ? -deltaX || -deltaY : deltaX || deltaY)
          : (event.type === "wheel" ? -deltaY : deltaY);
        const distance = isDragging ? d * 5 : d * 10;
        
        divItems.forEach((child) => {
          if (isHorizontal) {
            gsap.to(child, {
              duration: 0.5,
              ease: "expo.out",
              x: `+=${distance}`,
              modifiers: {
                x: gsap.utils.unitize(wrapFn),
              },
            });
          } else {
            gsap.to(child, {
              duration: 0.5,
              ease: "expo.out",
              y: `+=${distance}`,
              modifiers: {
                y: gsap.utils.unitize(wrapFn),
              },
            });
          }
        });
      },
    });

    let rafId;
    if (autoplay) {
      let directionFactor;
      if (isHorizontal) {
        directionFactor = autoplayDirection === "left" ? -1 : 1;
      } else {
        directionFactor = autoplayDirection === "down" ? 1 : -1;
      }
      
      const speedPerFrame = autoplaySpeed * directionFactor;

      const tick = () => {
        divItems.forEach((child) => {
          if (isHorizontal) {
            gsap.set(child, {
              x: `+=${speedPerFrame}`,
              modifiers: {
                x: gsap.utils.unitize(wrapFn),
              },
            });
          } else {
            gsap.set(child, {
              y: `+=${speedPerFrame}`,
              modifiers: {
                y: gsap.utils.unitize(wrapFn),
              },
            });
          }
        });
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      if (pauseOnHover) {
        const stopTicker = () => rafId && cancelAnimationFrame(rafId);
        const startTicker = () => (rafId = requestAnimationFrame(tick));

        container.addEventListener("mouseenter", stopTicker);
        container.addEventListener("mouseleave", startTicker);

        return () => {
          observer.kill();
          stopTicker();
          container.removeEventListener("mouseenter", stopTicker);
          container.removeEventListener("mouseleave", startTicker);
        };
      } else {
        return () => {
          observer.kill();
          rafId && cancelAnimationFrame(rafId);
        };
      }
    }

    return () => {
      observer.kill();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    items,
    autoplay,
    autoplaySpeed,
    autoplayDirection,
    pauseOnHover,
    isTilted,
    tiltDirection,
    negativeMargin,
  ]);

  return (
    <div
      className="relative flex items-center justify-center w-full overflow-hidden overscroll-none"
      ref={wrapperRef}
      style={{ maxHeight }}
    >
      <div className="absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-slate-800 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-slate-800 to-transparent z-10 pointer-events-none"></div>

      <div
        className={`flex overscroll-contain py-4 cursor-grab origin-center ${
          autoplayDirection === "left" || autoplayDirection === "right" ? "flex-row" : "flex-col px-4"
        }`}
        ref={containerRef}
        style={{
          width: autoplayDirection === "left" || autoplayDirection === "right" ? "auto" : width,
          height: autoplayDirection === "left" || autoplayDirection === "right" ? "100%" : "auto",
          transform: getTiltTransform(),
        }}
      >
        {items.map((item, i) => (
          <div
            className="flex items-center justify-center p-4 text-xl font-semibold text-center border-2 border-slate-600 rounded-[15px] select-none box-border relative bg-slate-700/50 hover:bg-slate-700/70 transition-colors flex-shrink-0"
            key={i}
            style={{
              height: autoplayDirection === "left" || autoplayDirection === "right" ? `${itemMinHeight}px` : `${itemMinHeight}px`,
              width: autoplayDirection === "left" || autoplayDirection === "right" ? `${itemMinHeight * 1.2}px` : "auto",
              marginTop: autoplayDirection === "left" || autoplayDirection === "right" ? "0" : negativeMargin,
              marginLeft: autoplayDirection === "left" || autoplayDirection === "right" ? negativeMargin : "0",
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}