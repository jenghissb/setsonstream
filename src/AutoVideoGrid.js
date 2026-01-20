import React, { useState, forwardRef, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { FixedSizeGrid as Grid, FixedSizeList } from "react-window";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DataRowHybrid } from './DataRowHybrid.js';
import "./AutoVideoGrid.css"

export function HorizontalVirtualList({
    showItemMatches, catInfo, items, tourneyById, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
    itemWidth = 300, height = 300 }
) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    horizontal: true,
    estimateSize: () => itemWidth,
    overscan: 3,
  });
  var stylename2 = "set-row-3-flex-small"

  const classArrowLeft = "avg-chevron-right-horiz-list-left" +
    ((virtualizer.scrollOffset > 100) ? "" :  " avg-chevron-hidden")
  const classArrowRight = "avg-chevron-right-horiz-list-right" +
    ((virtualizer.scrollOffset < (virtualizer.getTotalSize()-200-window.innerWidth)) ? "" : " avg-chevron-hidden")
  const arrowOffset = Math.min(1200,window.innerWidth)
  const useArrows = window.innerWidth >= 800;

  return (
    <div
      ref={parentRef}
      style={{
        width: "100%",
        height: `${height}px`,
        overflowX: "auto",
        overflowY: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${virtualizer.getTotalSize()}px`,
          height: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const index = virtualItem.index
          var item = items[index]
          var tourneySets = null
          if (catInfo.type == "tourneys") {
            const tourneyKey = items[index]
            tourneySets = tourneyById[tourneyKey]
            item = tourneySets[0]
          }

          const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
          return <div
            key={virtualItem.index}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translateX(${virtualItem.start}px)`,
              width: `${virtualItem.size}px`,
              height: "100%",
              display: "flex",
              alignItems: "start",
              justifyContent: "center",
              // borderRight: "1px solid #ddd",
            }}
          >
            <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
              <DataRowHybrid {...{showItemMatches, catInfo, item, tourneySets, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
            </div>
          </div>
      })}
      </div>
      { useArrows &&
        <div className={classArrowLeft}
          onClick={() => { console.log("left", virtualizer); virtualizer.scrollBy(-arrowOffset, { behavior: "smooth"})}}
        >
          <ChevronRight/>
        </div>
      }
      { useArrows &&
        <div className={classArrowRight}
          onClick={() => { console.log("left", virtualizer); virtualizer.scrollBy(arrowOffset, { behavior: "smooth"})}}
        >
          <ChevronRight/>
        </div>
      }
    </div>
  );
}

const ChevronRight = ({width=60, height=60, color="var(--arrow-color)"}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 448 448"><path fillOpacity="1" fill={color} strokeWidth="32" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="4" strokeDasharray="none" d="m384 871.925-37.46 36.437L224 789.17 101.46 908.362 64 871.925l37.426-36.403.034.033L224 716.362l122.54 119.193.034-.033z" transform="translate(0 -604.362)"/></svg>
}

export const AdaptiveVirtualVideoGrid2 = ({
  showItemMatches,
  parentRef,
  items, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  minItemWidth = 200,
  aspectRatio = 16 / 9,
  textHeightGuess = 124,
  padding = "4px",
  heightMult = 1.0,
}) => {
  // console.log(" Rendering AdaptiveVirtualVideoGrid2")

  // const items = jsonData
  var stylename1 = "setRows-flex"
  var stylename2 = "set-row-3-flex"

  const [parentWidth, setParentWidth] = useState(0);

  // Track parent width
  useLayoutEffect(() => {
    if (!parentRef.current) return;
    const update = () => setParentWidth(parentRef.current.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parentRef.current);
    return () => ro.disconnect();
  }, [parentRef.current]);

  // Fallback values until width known

  // const safeWidth = parentWidth || 1;
  const safeWidth = 340;
  const columnCount = Math.max(1, Math.floor(safeWidth / minItemWidth));
  const columnWidth = safeWidth / columnCount;
  const rowCount = Math.ceil(items.length / columnCount);

  const estimatedRowHeight = columnWidth / aspectRatio + textHeightGuess;
  // Always call hook (safe default sizes if width=0)
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 5,
    measureElement: (el) => {
      return el.getBoundingClientRect().height
    }, // <-- important
  });

  // Reset measurements if column count changes
  useLayoutEffect(() => {
    rowVirtualizer.measure();
  }, [columnCount, rowVirtualizer, parentRef.current]);

  // Shared ResizeObserver for adaptive row heights
  const sharedRO = useMemo(
    () =>
      new ResizeObserver((entries) => {
        for (const entry of entries) {
          rowVirtualizer.measureElement(entry.target);
        }
      }),
    [rowVirtualizer, parentRef.current]
  );

  const rowNodesRef = useRef(new Map());
  const setRowRef = useCallback(
    (rowIndex) => (el) => {
      const map = rowNodesRef.current;
      const prev = map.get(rowIndex);
      if (prev && prev !== el) {
        sharedRO.unobserve(prev);
        map.delete(rowIndex);
      }
      if (el) {
        map.set(rowIndex, el);
        sharedRO.observe(el);
        rowVirtualizer.measureElement(el);
      }
    },
    [sharedRO, rowVirtualizer]
  );

  useLayoutEffect(() => () => sharedRO.disconnect(), [sharedRO]);
  return (
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const start = rowIndex * columnCount;
          const rowItems = items.slice(start, start + columnCount);
          return (
            <div
              key={rowIndex}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              // ref={setRowRef(rowIndex)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start*heightMult}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                // gap: "8  px",
                paddingTop: "8px",
                paddingLeft: padding,
                paddingRight: padding,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {rowItems.map((item, i) => {
                const index = start+i
                const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
                return  <div
                    key={start + i}
                    // style={{
                    //   ...style,
                    //   padding: 8,
                    //   boxSizing: "border-box",
                    // }}
                  >
                    <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                      <DataRowHybrid {...{showItemMatches, item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
                    </div>
                  </div>


              //   <div
              //     key={start + i}
              //     style={{
              //       display: "flex",
              //       flexDirection: "column",
              //       background: "#fff",
              //       borderRadius: 6,
              //       overflow: "hidden",
              //       boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              //     }}
              //   >
              //     <div
              //       style={{
              //         width: "100%",
              //         aspectRatio: "16 / 9",
              //         background: "#aaa",
              //       }}
              //     />
              //     <div style={{ padding: "200px", fontSize: 14, color: "blue" }}>
              //       {item.setKey}
              //       {/* Some rows could be taller if text wraps more */}
              //       <p>
              //         Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              //         {rowIndex % 3 === 0 && " Extra line for testing. \ even more"}
              //       </p>
              //     </div>
              //   </div>
            })}
            </div>
          )
        })}
      </div>)
  
}

// Replace the default outer element (scrollable div)
// with a plain relative div that doesn't scroll
const OuterElement = forwardRef((props, ref) => (
  <div ref={ref} style={{ position: "relative" }} {...props} />
));

