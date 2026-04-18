declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  theme?: 'striped' | 'grid' | 'plain';
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: 'linebreak' | 'ellipsize' | 'hidden';
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number[];
    fontStyle?: string;
  };
  columnStyles?: {
    [key: number]: {
      cellWidth?: number;
      fontStyle?: string;
    };
  };
}
