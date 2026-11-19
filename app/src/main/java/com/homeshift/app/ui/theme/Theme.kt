package com.homeshift.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable

private val LightColors = lightColorScheme(
    primary = Teal,
    onPrimary = CardSurface,
    primaryContainer = TealContainer,
    onPrimaryContainer = OnTealContainer,
    secondary = Teal,
    onSecondary = CardSurface,
    secondaryContainer = TealContainer,
    onSecondaryContainer = OnTealContainer,
    background = Background,
    onBackground = Ink,
    surface = CardSurface,
    onSurface = Ink,
    surfaceVariant = Background,
    onSurfaceVariant = InkMuted,
    surfaceContainerLowest = CardSurface,
    surfaceContainerLow = CardSurface,
    surfaceContainer = CardSurface,
    surfaceContainerHigh = CardSurface,
    surfaceContainerHighest = Background,
    outline = CardBorder,
    outlineVariant = CardBorder,
    error = ErrorRed,
)

/** Light-only for now; a dark scheme is planned for the polish phase. */
@Composable
fun HomeShiftTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalExtendedColors provides LightExtendedColors) {
        MaterialTheme(
            colorScheme = LightColors,
            typography = HomeShiftTypography,
            shapes = HomeShiftShapes,
            content = content,
        )
    }
}

/** Access point for app-specific colour roles, e.g. `HomeShiftTheme.extendedColors.dueSoonContainer`. */
object HomeShiftTheme {
    val extendedColors: ExtendedColors
        @Composable @ReadOnlyComposable
        get() = LocalExtendedColors.current
}
