import React from "react";
import "./index.less";

export interface IEmptyLineProps {
  height?: number;
}

const EmptyLine = ({ height = 20 }: IEmptyLineProps) => {
  return <div className="empty-line" style={{ height }} />;
};

export default EmptyLine;
