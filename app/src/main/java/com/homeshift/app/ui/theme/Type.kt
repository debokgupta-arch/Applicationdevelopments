package com.homeshift.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.homeshift.app.R

val PlusJakartaSans = FontFamily(
    Font(R.font.plus_jakarta_sans_regular, FontWeight.Normal),
    Font(R.font.plus_jakarta_sans_medium, FontWeight.Medium),
    Font(R.font.plus_jakarta_sans_semibold, FontWeight.SemiBold),
    Font(R.font.plus_jakarta_sans_bold, FontWeight.Bold),
)

private val Default = Typography()

private fun TextStyle.jakarta(weight: FontWeight? = null) =
    copy(fontFamily = PlusJakartaSans, fontWeight = weight ?: fontWeight)

internal val HomeShiftTypography = Typography(
    displayLarge = Default.displayLarge.jakarta(FontWeight.Bold),
    displayMedium = Default.displayMedium.jakarta(FontWeight.Bold),
    displaySmall = Default.displaySmall.jakarta(FontWeight.Bold),
    headlineLarge = Default.headlineLarge.jakarta(FontWeight.Bold),
    headlineMedium = Default.headlineMedium.jakarta(FontWeight.Bold),
    headlineSmall = Default.headlineSmall.jakarta(FontWeight.Bold),
    titleLarge = Default.titleLarge.jakarta(FontWeight.Bold),
    titleMedium = Default.titleMedium.jakarta(FontWeight.SemiBold),
    titleSmall = Default.titleSmall.jakarta(FontWeight.SemiBold),
    bodyLarge = Default.bodyLarge.jakarta(),
    bodyMedium = Default.bodyMedium.jakarta(),
    bodySmall = Default.bodySmall.jakarta(),
    labelLarge = Default.labelLarge.jakarta(FontWeight.SemiBold),
    labelMedium = Default.labelMedium.jakarta(FontWeight.SemiBold),
    labelSmall = Default.labelSmall.jakarta(FontWeight.SemiBold),
)
