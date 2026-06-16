// React.memo — only the specific cell that changed re-renders (1200 cells total)
const { useRef, useEffect } = React;

const Cell = React.memo(function Cell({ blockId, data, userId, claimBlock, unclaimBlock }) {
  const ref = useRef(null);
  const prevOwner = useRef(null);

  // Trigger pulse animation when ownership changes
  useEffect(() => {
    if (data?.ownerId && data.ownerId !== prevOwner.current) {
      ref.current?.classList.add('cell-pulse');
      setTimeout(() => ref.current?.classList.remove('cell-pulse'), 450);
      prevOwner.current = data.ownerId;
    }
  }, [data?.ownerId]);

  const isOwn  = data?.ownerId === userId;
  const bg     = data?.ownerColor ?? '#1f2937';
  const label  = isOwn
    ? 'Your block — right-click to unclaim'
    : data?.ownerName ? `Owned by ${data.ownerName}` : 'Unclaimed';

  return (
    <div
      ref={ref}
      title={label}
      onClick={() => claimBlock(blockId)}
      onContextMenu={(e) => { e.preventDefault(); if (isOwn) unclaimBlock(blockId); }}
      style={{ backgroundColor: bg, outline: isOwn ? '1px solid rgba(255,255,255,0.25)' : 'none' }}
      className="aspect-square cursor-pointer rounded-sm transition-[filter] duration-150 hover:brightness-150"
    />
  );
});

window.Cell = Cell;
