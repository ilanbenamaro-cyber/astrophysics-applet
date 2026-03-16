/**
 * fft2d.js
 * 2D FFT and IFFT built on math.js 1D transforms.
 * All inputs must be N×N plain Arrays where N is a power of 2.
 * Returns N×N Arrays of math.js Complex objects (or real numbers for ifft2d).
 */

/**
 * Compute the 2D FFT of a real N×N input.
 * Algorithm: row-wise FFT, then column-wise FFT (separable 2D DFT).
 * @param {number[][]} real - N×N array of real pixel values
 * @returns {object[][]} N×N array of math.js Complex
 */
function fft2d(real) {
    const N = real.length;

    // Step 1: FFT each row
    const afterRows = real.map(row => Array.from(math.fft(row)));

    // Step 2: FFT each column of the row-transformed result
    const result = afterRows.map(row => row.slice());
    for (let j = 0; j < N; j++) {
        const col = result.map(row => row[j]);
        const colFFT = Array.from(math.fft(col));
        colFFT.forEach((val, i) => { result[i][j] = val; });
    }
    return result;
}

/**
 * Compute the 2D IFFT of a complex N×N array.
 * Algorithm: column-wise IFFT, then row-wise IFFT (reverse of fft2d order).
 * math.js ifft normalizes by 1/N per pass, giving 1/N² total — correct for 2D.
 * @param {object[][]} complex - N×N array of math.js Complex
 * @returns {number[][]} N×N array of real values (imaginary residuals discarded)
 */
function ifft2d(complex) {
    const N = complex.length;

    // Step 1: IFFT each column
    const afterCols = complex.map(row => row.slice());
    for (let j = 0; j < N; j++) {
        const col = afterCols.map(row => row[j]);
        const colIFFT = Array.from(math.ifft(col));
        colIFFT.forEach((val, i) => { afterCols[i][j] = val; });
    }

    // Step 2: IFFT each row; extract real part (imaginary residuals are ~0 for valid input)
    return afterCols.map(row => Array.from(math.ifft(row)).map(c => c.re));
}

/**
 * FFT shift: move the zero-frequency component to the center of the array.
 * Used for display purposes only (not applied before masking).
 * For even N, this operation is its own inverse.
 * @param {any[][]} arr - N×N array
 * @returns {any[][]} shifted copy
 */
function fftShift(arr) {
    const N = arr.length;
    const half = N / 2;
    const out = Array.from({ length: N }, () => new Array(N));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            out[(i + half) % N][(j + half) % N] = arr[i][j];
        }
    }
    return out;
}
