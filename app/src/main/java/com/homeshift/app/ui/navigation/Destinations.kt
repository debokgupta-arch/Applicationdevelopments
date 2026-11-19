package com.homeshift.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import com.homeshift.app.R

/** Tabs shown in the bottom navigation bar, in display order. */
enum class TopLevelDestination(
    val route: String,
    @StringRes val labelRes: Int,
    @DrawableRes val iconRes: Int,
) {
    HOME(route = "home", labelRes = R.string.nav_home, iconRes = R.drawable.ic_home),
    TASKS(route = "tasks", labelRes = R.string.nav_tasks, iconRes = R.drawable.ic_tasks),
    PLAN(route = "plan", labelRes = R.string.nav_plan, iconRes = R.drawable.ic_plan),
    VENDORS(route = "vendors", labelRes = R.string.nav_vendors, iconRes = R.drawable.ic_vendors),
}

/** Module detail screen, e.g. Painting. */
object ModuleDetailDestination {
    const val ARG_MODULE_ID = "moduleId"
    const val ROUTE = "module/{$ARG_MODULE_ID}"

    fun createRoute(moduleId: Long): String = "module/$moduleId"
}
