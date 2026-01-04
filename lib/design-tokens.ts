/**
 * Design Tokens - Mokkup.ai Theme Colors
 * 
 * This file contains all color values from the Mokkup.ai design system
 * plus currently used dashboard colors for easy reference and updates.
 * 
 * Last updated: Based on Mokkup.ai design specification
 */

/**
 * Helper function to convert hex to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Color entry interface
 */
export interface ColorEntry {
  hex: string
  rgb: string
  name: string
  usage?: string
}

/**
 * Main Palette Colors (Primary, Secondary, Tertiary, Default)
 */
export const MainPalette = {
  primary: {
    title: {
      hex: '#0D076A',
      rgb: hexToRgb('#0D076A'),
      name: 'Primary Title',
      usage: 'Main title color, header background'
    },
    color1: {
      hex: '#342BC2',
      rgb: hexToRgb('#342BC2'),
      name: 'Primary Color 1',
      usage: 'Primary accent color'
    },
    color2: {
      hex: '#6F67F1',
      rgb: hexToRgb('#6F67F1'),
      name: 'Primary Color 2',
      usage: 'Primary variant'
    },
    color3: {
      hex: '#9993FF',
      rgb: hexToRgb('#9993FF'),
      name: 'Primary Color 3',
      usage: 'Primary light variant'
    },
    color4: {
      hex: '#417ED9',
      rgb: hexToRgb('#417ED9'),
      name: 'Primary Color 4',
      usage: 'Primary blue variant'
    }
  },
  secondary: {
    color5: {
      hex: '#2565C3',
      rgb: hexToRgb('#2565C3'),
      name: 'Secondary Color 5',
      usage: 'Secondary blue'
    },
    color6: {
      hex: '#1897BF',
      rgb: hexToRgb('#1897BF'),
      name: 'Secondary Color 6',
      usage: 'Secondary teal'
    },
    color7: {
      hex: '#2DB7E2',
      rgb: hexToRgb('#2DB7E2'),
      name: 'Secondary Color 7',
      usage: 'Secondary cyan'
    },
    color8: {
      hex: '#7CDBF9',
      rgb: hexToRgb('#7CDBF9'),
      name: 'Secondary Color 8',
      usage: 'Secondary light blue'
    },
    color9: {
      hex: '#D0ACED',
      rgb: hexToRgb('#D0ACED'),
      name: 'Secondary Color 9',
      usage: 'Secondary lavender'
    }
  },
  tertiary: {
    color10: {
      hex: '#AB81CD',
      rgb: hexToRgb('#AB81CD'),
      name: 'Tertiary Color 10',
      usage: 'Tertiary purple'
    },
    color11: {
      hex: '#654597',
      rgb: hexToRgb('#654597'),
      name: 'Tertiary Color 11',
      usage: 'Tertiary dark purple'
    },
    color12: {
      hex: '#7BEEE9',
      rgb: hexToRgb('#7BEEE9'),
      name: 'Tertiary Color 12',
      usage: 'Tertiary aqua'
    },
    color13: {
      hex: '#57DAD4',
      rgb: hexToRgb('#57DAD4'),
      name: 'Tertiary Color 13',
      usage: 'Tertiary teal'
    },
    color14: {
      hex: '#22BDB6',
      rgb: hexToRgb('#22BDB6'),
      name: 'Tertiary Color 14',
      usage: 'Tertiary dark teal'
    }
  },
  default: {
    black: {
      hex: '#000000',
      rgb: hexToRgb('#000000'),
      name: 'Black',
      usage: 'Pure black'
    },
    gray1: {
      hex: '#5E5E5E',
      rgb: hexToRgb('#5E5E5E'),
      name: 'Gray 1',
      usage: 'Dark gray'
    },
    gray2: {
      hex: '#9CA0A9',
      rgb: hexToRgb('#9CA0A9'),
      name: 'Gray 2',
      usage: 'Medium gray'
    },
    green: {
      hex: '#93BF35',
      rgb: hexToRgb('#93BF35'),
      name: 'Green',
      usage: 'Success/accent green'
    },
    yellow: {
      hex: '#FABD63',
      rgb: hexToRgb('#FABD63'),
      name: 'Yellow',
      usage: 'Warning/accent yellow'
    },
    red: {
      hex: '#DD7070',
      rgb: hexToRgb('#DD7070'),
      name: 'Red',
      usage: 'Error/accent red'
    }
  }
}

/**
 * Contrast Palette Colors (for combo charts)
 */
export const ContrastPalette = {
  primary: {
    color1: {
      hex: '#227B77',
      rgb: hexToRgb('#227B77'),
      name: 'Contrast Primary 1',
      usage: 'Dark teal'
    },
    color2: {
      hex: '#44B0AB',
      rgb: hexToRgb('#44B0AB'),
      name: 'Contrast Primary 2',
      usage: 'Medium teal'
    },
    color3: {
      hex: '#87DFDB',
      rgb: hexToRgb('#87DFDB'),
      name: 'Contrast Primary 3',
      usage: 'Light cyan'
    },
    color4: {
      hex: '#FFD79C',
      rgb: hexToRgb('#FFD79C'),
      name: 'Contrast Primary 4',
      usage: 'Light orange'
    },
    color5: {
      hex: '#FABD63',
      rgb: hexToRgb('#FABD63'),
      name: 'Contrast Primary 5',
      usage: 'Orange (same as Default Yellow)'
    }
  },
  secondary: {
    color6: {
      hex: '#EDA436',
      rgb: hexToRgb('#EDA436'),
      name: 'Contrast Secondary 6',
      usage: 'Orange-brown'
    },
    color7: {
      hex: '#6FA9F2',
      rgb: hexToRgb('#6FA9F2'),
      name: 'Contrast Secondary 7',
      usage: 'Light blue'
    },
    color8: {
      hex: '#3F86E0',
      rgb: hexToRgb('#3F86E0'),
      name: 'Contrast Secondary 8',
      usage: 'Medium blue'
    },
    color9: {
      hex: '#0E5CC0',
      rgb: hexToRgb('#0E5CC0'),
      name: 'Contrast Secondary 9',
      usage: 'Dark blue'
    },
    color10: {
      hex: '#2C7DA0',
      rgb: hexToRgb('#2C7DA0'),
      name: 'Contrast Secondary 10',
      usage: 'Blue-green'
    }
  },
  tertiary: {
    color11: {
      hex: '#61A5C2',
      rgb: hexToRgb('#61A5C2'),
      name: 'Contrast Tertiary 11',
      usage: 'Muted blue-green'
    },
    color12: {
      hex: '#A9D6E5',
      rgb: hexToRgb('#A9D6E5'),
      name: 'Contrast Tertiary 12',
      usage: 'Very light blue'
    },
    color13: {
      hex: '#F4A2A2',
      rgb: hexToRgb('#F4A2A2'),
      name: 'Contrast Tertiary 13',
      usage: 'Light pink'
    },
    color14: {
      hex: '#DA6356',
      rgb: hexToRgb('#DA6356'),
      name: 'Contrast Tertiary 14',
      usage: 'Reddish-orange'
    },
    color15: {
      hex: '#B51706',
      rgb: hexToRgb('#B51706'),
      name: 'Contrast Tertiary 15',
      usage: 'Dark red'
    }
  }
}

/**
 * Dashboard-specific colors (currently in use)
 */
export const DashboardColors = {
  header: {
    background: {
      hex: '#0D076A',
      rgb: 'rgb(13, 7, 106)',
      name: 'Header Background',
      usage: 'Dashboard header background color'
    },
    text: {
      hex: '#FFFFFF',
      rgb: 'rgb(255, 255, 255)',
      name: 'Header Text',
      usage: 'Header text color (white)'
    }
  },
  text: {
    primary: {
      hex: '#0D076A',
      rgb: 'rgb(13, 7, 106)',
      name: 'Primary Text',
      usage: 'Main text color throughout dashboard'
    }
  },
  borders: {
    light: {
      hex: '#EEEEEE',
      rgb: 'rgb(238, 238, 238)',
      name: 'Light Border',
      usage: 'Card borders, table borders'
    },
    lighter: {
      hex: '#E8E8E8',
      rgb: 'rgb(232, 232, 232)',
      name: 'Lighter Border',
      usage: 'Subtle borders, dividers'
    }
  },
  kpi: {
    accentGreen: {
      hex: '#93BF35',
      rgb: 'rgb(147, 191, 53)',
      name: 'KPI Accent Green',
      usage: 'KPI card bottom accent line (positive metrics)'
    },
    accentRed: {
      hex: '#DD7070',
      rgb: 'rgb(221, 112, 112)',
      name: 'KPI Accent Red',
      usage: 'KPI card bottom accent line (cost/negative metrics)'
    }
  },
  charts: {
    title: {
      hex: '#007db7',
      rgb: hexToRgb('#007db7'),
      name: 'Chart Title',
      usage: 'Chart section titles (Success Rate, Execution Trend, etc.)'
    }
  },
  background: {
    white: {
      hex: '#FFFFFF',
      rgb: 'rgb(255, 255, 255)',
      name: 'White Background',
      usage: 'Page and card backgrounds'
    }
  }
}

/**
 * Treemap colors (currently used in WorkflowROIContribution)
 */
export const TreemapColors = [
  {
    hex: '#342BC2',
    rgb: 'rgb(52, 43, 194)',
    name: 'Treemap Color 1',
    usage: 'Dark purple/blue - first workflow'
  },
  {
    hex: '#6F67F1',
    rgb: 'rgb(111, 103, 241)',
    name: 'Treemap Color 2',
    usage: 'Purple - second workflow'
  },
  {
    hex: '#9993FF',
    rgb: 'rgb(153, 147, 255)',
    name: 'Treemap Color 3',
    usage: 'Light purple - third workflow'
  },
  {
    hex: '#417ED9',
    rgb: 'rgb(65, 126, 217)',
    name: 'Treemap Color 4',
    usage: 'Blue - fourth workflow'
  },
  {
    hex: '#2565C3',
    rgb: 'rgb(37, 101, 195)',
    name: 'Treemap Color 5',
    usage: 'Darker blue - fifth workflow'
  },
  {
    hex: '#1897BF',
    rgb: 'rgb(24, 151, 191)',
    name: 'Treemap Color 6',
    usage: 'Teal/cyan - sixth workflow'
  }
]

/**
 * Consolidated Colors object for easy access
 */
export const Colors = {
  main: MainPalette,
  contrast: ContrastPalette,
  dashboard: DashboardColors,
  treemap: TreemapColors
}

/**
 * Quick access arrays for color palettes (useful for charts)
 */
export const PrimaryColors = [
  MainPalette.primary.title,
  MainPalette.primary.color1,
  MainPalette.primary.color2,
  MainPalette.primary.color3,
  MainPalette.primary.color4
]

export const SecondaryColors = [
  MainPalette.secondary.color5,
  MainPalette.secondary.color6,
  MainPalette.secondary.color7,
  MainPalette.secondary.color8,
  MainPalette.secondary.color9
]

export const TertiaryColors = [
  MainPalette.tertiary.color10,
  MainPalette.tertiary.color11,
  MainPalette.tertiary.color12,
  MainPalette.tertiary.color13,
  MainPalette.tertiary.color14
]

/**
 * Default export for convenience
 */
export default Colors

