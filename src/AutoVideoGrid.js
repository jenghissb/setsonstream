import React, { useState, forwardRef, useRef, useMemo, useCallback, useEffect, useLayoutEffect } from "react";
import { FixedSizeGrid as Grid, FixedSizeList } from "react-window";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DataRowHybrid } from './DataRowHybrid.js';
import "./Home2.css"


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
  var stylename2 = "home2set-row-3-flex-small"


  return (
    <div
      ref={parentRef}
      style={{
        width: "100%",
        height: `${height}px`,
        overflowX: "auto",
        overflowY: "hidden",
        position: "relative",
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
    </div>
  );
}

export function HorizontalVirtualList3({ 
    items, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
}) {
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"
  const containerRef = useRef(null);
  const itemWidth = 300; // width of each item
  const itemHeight = 300; // height of list container

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: itemHeight,
        overflowX: "auto",
        overflowY: "hidden",
        border: "1px solid #ccc",
        whiteSpace: "nowrap",
      }}
    >
      <FixedSizeList
        layout="horizontal"
        height={itemHeight}
        width={containerRef.current ? containerRef.current.clientWidth : 0}
        itemCount={items.length}
        itemSize={itemWidth}
        style={{ overflow: "visible" }} // parent scroll container is this div
      >
        {({ index, style }) => {
          const item = items[index]
          const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
          return <div
            style={{
              ...style,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "4px",
              background: "#eee",
              border: "1px solid #ccc",
            }}
          >
            <div
              // style={{
              //   ...style,
              //   padding: 8,
              //   boxSizing: "border-box",
              // }}
            >
              <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
              </div>
            </div>
          </div>
        
        }}
      </FixedSizeList>
    </div>
  );
}

export function VirtualList({
  parentRef,
  items, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
}) {
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"
  const itemHeight = 340; // px
  const itemCount = items.length;
  const [parentHeight, setParentHeight] = useState(0);

  useLayoutEffect(() => {
    if (!parentRef.current) return;
    const update = () => setParentHeight(parentRef.current.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parentRef.current);
    return () => ro.disconnect();
  }, [parentRef.current]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <FixedSizeList
      height={parentHeight}//parentRef.current ? parentRef.current.clientHeight : 0}
      width="100%"
      itemCount={itemCount}
      itemSize={itemHeight}
      outerRef={parentRef}  // 👈 use the parent's scroll container
      style={{ overflow: "visible" }} // let parent handle scroll
    >
      {({ index, style }) => {
        const item = items[index]
        const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
        return <div style={style} className="list-item">
                  <div
                    // style={{
                    //   ...style,
                    //   padding: 8,
                    //   boxSizing: "border-box",
                    // }}
                  >
                    <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                      <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
                    </div>
                  </div>
        </div>
      }}
    </FixedSizeList>
  );
}


export const AdaptiveVirtualVideoGrid2 = ({
  showItemMatches,
  parentRef,
  items, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  minItemWidth = 200,
  aspectRatio = 16 / 9,
  textHeightGuess = 124,
  padding = "4px"
}) => {
  // console.log(" Rendering AdaptiveVirtualVideoGrid2")

  // const items = jsonData
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"

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
                transform: `translateY(${virtualRow.start}px)`,
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


export const AdaptiveVirtualVideoGrid = ({
  jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  minItemWidth = 200,
  aspectRatio = 16 / 9,
}) => {
  const items = jsonData
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"

  const parentRef = useRef(null);
  const [parentWidth, setParentWidth] = useState(0);

  // Measure parent width on mount and resize
  useLayoutEffect(() => {
    if (!parentRef.current) return;

    const updateWidth = () => setParentWidth(parentRef.current.offsetWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(parentRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const pWidth = Math.min(parentWidth, 10)

  const columnCount = Math.max(1, Math.floor(parentWidth / minItemWidth));
  const columnWidth = parentWidth / columnCount;
  const rowCount = Math.ceil(items.length / columnCount);

  // Use rough estimate for virtualization
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => columnWidth / aspectRatio + 60, // rough guess
    overscan: 5,
  });
  if (parentWidth <= 10)
    return <div ref={parentRef} style={{ width: "100%" }} />;

  return
  // return (
  //   <div
  //     ref={parentRef}
  //     style={{
  //       width: "100%",
  //       height: "100%",
  //       overflowY: "auto",
  //       position: "relative",
  //     }}
  //   >
  //     <div
  //       style={{
  //         height: rowVirtualizer.getTotalSize(),
  //         width: "100%",
  //         position: "relative",
  //       }}
  //     >
  //       {rowVirtualizer.getVirtualItems().map((virtualRow) => {
  //         const rowIndex = virtualRow.index;
  //         const start = rowIndex * columnCount;
  //         const rowItems = items.slice(start, start + columnCount);

  //         return (
  //           <div
  //             key={rowIndex}
  //             ref={rowVirtualizer.measureElement} // measures actual row height
  //             style={{
  //               position: "absolute",
  //               top: 0,
  //               left: 0,
  //               transform: `translateY(${virtualRow.start}px)`,
  //               display: "grid",
  //               gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
  //               gap: "8px",
  //               padding: "8px",
  //               boxSizing: "border-box",
  //               width: "100%",
  //             }}
  //           >
  //             {rowItems.map((item, i) => {
  //               const index = start+i
  //               const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
  //               return (  
  //                 <div
  //                   // style={{
  //                   //   ...style,
  //                   //   padding: 8,
  //                   //   boxSizing: "border-box",
  //                   // }}
  //                 >
  //                   <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
  //                     <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
  //                   </div>
  //                 </div>
  //               )
  //             })}
  //           </div>
  //         )
  //       }
  //       </div>
  //       </div>
  //     )
       
}

export const VirtualVideoGrid = ({
  jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  minItemWidth = 340,
  textHeight = 130,
  parentRef,
  aspectRatio = 16 / 9,
}) => {
  // const parentRef = useRef(null);
  const items = jsonData
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"

  // We'll compute column count based on parent width
  const columnCount = parentRef.current
    ? Math.max(1, Math.floor(parentRef.current.offsetWidth / minItemWidth))
    : 1;

  const columnWidth = parentRef.current
    ? parentRef.current.offsetWidth / columnCount
    : minItemWidth;

  const rowHeight = columnWidth / aspectRatio + textHeight;
  const rowCount = Math.ceil(items.length / columnCount);

  // Virtualizer listens to parent scroll
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5, // number of extra rows to render outside viewport
  });

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
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translateY(${virtualRow.start}px)`,
              display: "grid",
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              gap: "8px",
              padding: "8px",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            {rowItems.map((item, i) => {
              const index = start+i
              const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
              return (  
                <div
                  // style={{
                  //   ...style,
                  //   padding: 8,
                  //   boxSizing: "border-box",
                  // }}
                >
                  <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                    <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
                  </div>
                </div>
              )
            })}
          </div>
          );
        })}
      </div>
  )
}






// Replace the default outer element (scrollable div)
// with a plain relative div that doesn't scroll
const OuterElement = forwardRef((props, ref) => (
  <div ref={ref} style={{ position: "relative" }} {...props} />
));

export const VideoDataGrid = ({
  jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  parentWidth,      // width of the container (from parent)
  minItemWidth = 200,
  textHeight = 60,
  aspectRatio = 16 / 9,
}) => {
  const items = jsonData


  // Dynamically calculate columns based on parent width
  const columnCount = Math.max(1, Math.floor(parentWidth / minItemWidth));
  const columnWidth = parentWidth / columnCount;

  // Row height = video + text
  const rowHeight = columnWidth / aspectRatio + textHeight;
  const rowCount = Math.ceil(items.length / columnCount);


  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"


  return (
    <Grid
      outerElementType={OuterElement}   // disables internal scrolling
      columnCount={columnCount}
      columnWidth={columnWidth}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={parentWidth}
      height={rowCount * rowHeight}     // total height; parent scrolls
      style={{ overflow: "visible" }}   // let parent handle scrolling
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= items.length) return null;
        const item = items[index]
        const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0

        return (  
          <div
            style={{
              ...style,
              padding: 8,
              boxSizing: "border-box",
            }}
          >
            <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
              <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
            </div>
          </div>
        )

        return (
          <div
            style={{
              ...style,
              padding: 8,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background: "#eee",
                borderRadius: 8,
                height: "100%",
              }}
            >
              {items[index]}
            </div>
          </div>
        );
      }}
    </Grid>
  );
};




export const AutoVideoGrid = ({
  jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef,
  minItemWidth = 200,
  textHeight = 60,
  aspectRatio = 16 / 9
}) => {
  const items = jsonData
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0, columnCount: 1 });
  var stylename1 = "home2setRows-flex"
  var stylename2 = "home2set-row-3-flex"

  // Recompute layout on resize
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        const columnCount = Math.max(1, Math.floor(width / minItemWidth));
        setDims({ width, height, columnCount });
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { width, height, columnCount } = dims;
  const columnWidth = width / columnCount;
  const videoHeight = columnWidth / aspectRatio;
  const rowHeight = videoHeight + textHeight;
  const rowCount = Math.ceil(items.length / columnCount);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {width > 0 && height > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={height}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
        >
          {({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * columnCount + columnIndex;
            if (index >= items.length) return null;
            const item = items[index]
            const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0

            return (  
              <div
                style={{
                  ...style,
                  padding: 8,
                  boxSizing: "border-box",
                }}
              >
                <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                  <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
                </div>
              </div>
            )


            return (
              <div
                style={{
                  ...style,
                  padding: 8,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    background: "#ddd",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%"
                  }}
                >
                  {/* Video placeholder */}
                  <div
                    style={{
                      background: "#aaa",
                      aspectRatio: "16/9", // works in modern browsers
                      width: "100%"
                    }}
                  >
                    {/* could put <img> or <video> here */}
                  </div>

                  {/* Text section */}
                  <div
                    style={{
                      padding: "8px",
                      background: "white",
                      flexShrink: 0,
                      height: textHeight
                    }}
                  >
                    <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
                      <DataRowHybrid {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
                    </div>

                      {/* items[index] */}
                  </div>
                </div>
              </div>
            );
          }}
        </Grid>
      )}
    </div>
  );
};
