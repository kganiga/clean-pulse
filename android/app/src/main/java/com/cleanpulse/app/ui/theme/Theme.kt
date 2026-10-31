package com.cleanpulse.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Emerald = Color(0xFF10B981)
val Cyan = Color(0xFF06B6D4)
val Amber = Color(0xFFF59E0B)
val Rose = Color(0xFFF43F5E)
val Slate400 = Color(0xFF94A3B8)
val Slate500 = Color(0xFF64748B)

// The brand artwork is dark, so the app always uses the dark scheme.
private val CleanPulseColors = darkColorScheme(
    primary = Emerald,
    onPrimary = Color(0xFF02150E),
    primaryContainer = Color(0xFF064E3B),
    onPrimaryContainer = Color(0xFFD1FAE5),
    secondary = Cyan,
    onSecondary = Color(0xFF021418),
    tertiary = Amber,
    background = Color(0xFF020617),
    onBackground = Color(0xFFF8FAFC),
    surface = Color(0xFF020617),
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Slate400,
    surfaceContainerLowest = Color(0xFF020617),
    surfaceContainerLow = Color(0xFF0B1222),
    surfaceContainer = Color(0xFF0F172A),
    surfaceContainerHigh = Color(0xFF162033),
    surfaceContainerHighest = Color(0xFF1E293B),
    outline = Color(0xFF334155),
    outlineVariant = Color(0xFF1E293B),
    error = Rose
)

@Composable
fun CleanPulseTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = CleanPulseColors, content = content)
}
