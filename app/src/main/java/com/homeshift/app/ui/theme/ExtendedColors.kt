package com.homeshift.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/** App-specific colour roles that Material 3's [androidx.compose.material3.ColorScheme] has no slot for. */
@Immutable
data class ExtendedColors(
    val cardBorder: Color,
    val dueSoonContainer: Color,
    val onDueSoonContainer: Color,
    val customTagContainer: Color,
    val onCustomTagContainer: Color,
)

internal val LightExtendedColors = ExtendedColors(
    cardBorder = CardBorder,
    dueSoonContainer = DueSoonContainer,
    onDueSoonContainer = OnDueSoonContainer,
    customTagContainer = CustomTagContainer,
    onCustomTagContainer = OnCustomTagContainer,
)

internal val LocalExtendedColors = staticCompositionLocalOf { LightExtendedColors }
