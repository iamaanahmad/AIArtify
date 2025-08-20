import React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <span 
      className={`absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden ${className}`}
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden"
      }}
    >
      {children}
    </span>
  );
};

export default VisuallyHidden;
