import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  File, 
  FileCode, 
  Plus, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Check, 
  X 
} from 'lucide-react';

export default function FileTreeItem({ 
  item, 
  depth = 0, 
  activeFileId, 
  onFileClick, 
  onAddFile, 
  onAddFolder, 
  onRename, 
  onDelete 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  
  // States for adding files/folders inline
  const [showAddFile, setShowAddFile] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newValue, setNewValue] = useState('');

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.html')) return <FileCode size={16} style={{ color: '#e34f26' }} />;
    if (fileName.endsWith('.css')) return <FileCode size={16} style={{ color: '#1572b6' }} />;
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return <FileCode size={16} style={{ color: '#f7df1e' }} />;
    if (fileName.endsWith('.json')) return <FileCode size={16} style={{ color: '#8c8c8c' }} />;
    if (fileName.endsWith('.py')) return <FileCode size={16} style={{ color: '#3776ab' }} />;
    return <File size={16} style={{ color: '#d8dee9' }} />;
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleItemClick = () => {
    if (item.isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue !== item.name) {
      onRename(item.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    if (newValue.trim()) {
      onAddFile(item.id, newValue.trim());
      setIsExpanded(true); // make sure folder is expanded
    }
    setShowAddFile(false);
    setNewValue('');
  };

  const handleCreateFolderSubmit = (e) => {
    e.preventDefault();
    if (newValue.trim()) {
      onAddFolder(item.id, newValue.trim());
      setIsExpanded(true);
    }
    setShowAddFolder(false);
    setNewValue('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Item Row */}
      <div 
        className={`tree-item ${activeFileId === item.id ? 'active' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        onClick={handleItemClick}
      >
        {/* Chevron for folder */}
        {item.isFolder ? (
          <span onClick={handleToggleExpand} style={{ display: 'flex', alignItems: 'center' }}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 14 }}></span>
        )}

        {/* Icon */}
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {item.isFolder ? (
            isExpanded ? 
              <FolderOpen size={16} style={{ color: 'var(--accent-cyan)' }} /> : 
              <Folder size={16} style={{ color: 'var(--accent-cyan)' }} />
          ) : (
            getFileIcon(item.name)
          )}
        </span>

        {/* Name / Rename Input */}
        {isRenaming ? (
          <form 
            onSubmit={handleRenameSubmit} 
            onClick={(e) => e.stopPropagation()} 
            style={{ flex: 1, display: 'flex', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              style={{ 
                height: '22px', 
                fontSize: '0.85rem', 
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.08)' 
              }}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onBlur={() => setIsRenaming(false)}
            />
          </form>
        ) : (
          <span className="tree-item-name">{item.name}</span>
        )}

        {/* Actions buttons */}
        {!isRenaming && (
          <div className="tree-item-actions" onClick={(e) => e.stopPropagation()}>
            {item.isFolder && (
              <>
                <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => setShowAddFile(true)}>
                  <Plus size={12} />
                </button>
                <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => setShowAddFolder(true)}>
                  <FolderPlus size={12} />
                </button>
              </>
            )}
            <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => setIsRenaming(true)}>
              <Edit2 size={12} />
            </button>
            <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={() => onDelete(item.id)}>
              <Trash2 size={12} style={{ color: '#ff3366' }} />
            </button>
          </div>
        )}
      </div>

      {/* Inline Input to Add File */}
      {showAddFile && (
        <div style={{ paddingLeft: `${(depth + 1) * 14 + 12}px`, display: 'flex', alignItems: 'center', height: 28 }}>
          <span style={{ width: 14 }}></span>
          <File size={14} style={{ marginRight: 6, color: '#d8dee9' }} />
          <form onSubmit={handleCreateFileSubmit} style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ height: '22px', fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)' }}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="filename.js"
              autoFocus
              onBlur={() => setShowAddFile(false)}
            />
          </form>
        </div>
      )}

      {/* Inline Input to Add Folder */}
      {showAddFolder && (
        <div style={{ paddingLeft: `${(depth + 1) * 14 + 12}px`, display: 'flex', alignItems: 'center', height: 28 }}>
          <span style={{ width: 14 }}></span>
          <Folder size={14} style={{ marginRight: 6, color: 'var(--accent-cyan)' }} />
          <form onSubmit={handleCreateFolderSubmit} style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              style={{ height: '22px', fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)' }}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="folder name"
              autoFocus
              onBlur={() => setShowAddFolder(false)}
            />
          </form>
        </div>
      )}

      {/* Nested Children */}
      {item.isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              onFileClick={onFileClick}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
