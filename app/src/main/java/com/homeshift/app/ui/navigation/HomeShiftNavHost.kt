package com.homeshift.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.homeshift.app.ui.home.HomeScreen
import com.homeshift.app.ui.module.ModuleDetailScreen
import com.homeshift.app.ui.plan.PlanScreen
import com.homeshift.app.ui.tasks.TasksScreen
import com.homeshift.app.ui.vendors.VendorsScreen

@Composable
fun HomeShiftNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = TopLevelDestination.HOME.route,
        modifier = modifier,
    ) {
        composable(TopLevelDestination.HOME.route) {
            HomeScreen(
                onOpenModule = { id -> navController.navigate(ModuleDetailDestination.createRoute(id)) },
                onNotificationsClick = {},
            )
        }
        composable(TopLevelDestination.TASKS.route) {
            TasksScreen(onAddClick = {})
        }
        composable(TopLevelDestination.PLAN.route) {
            PlanScreen()
        }
        composable(TopLevelDestination.VENDORS.route) {
            VendorsScreen()
        }
        composable(
            route = ModuleDetailDestination.ROUTE,
            arguments = listOf(
                navArgument(ModuleDetailDestination.ARG_MODULE_ID) { type = NavType.LongType },
            ),
        ) { entry ->
            ModuleDetailScreen(
                moduleId = entry.arguments?.getLong(ModuleDetailDestination.ARG_MODULE_ID) ?: 0L,
                onBack = navController::popBackStack,
                onAddClick = {},
            )
        }
    }
}
