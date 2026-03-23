// Shared HTM binding and re-exported React hooks — imported by every component.
import { createElement, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import htm from 'htm';

export const html = htm.bind(createElement);
export { useState, useEffect, useCallback, useRef, useMemo };
