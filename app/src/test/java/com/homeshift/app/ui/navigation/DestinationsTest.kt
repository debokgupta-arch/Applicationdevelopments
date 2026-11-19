package com.homeshift.app.ui.navigation

import org.junit.Assert.assertEquals
import org.junit.Test

class DestinationsTest {

    @Test
    fun `bottom nav has four tabs in spec order`() {
        assertEquals(
            listOf("home", "tasks", "plan", "vendors"),
            TopLevelDestination.entries.map { it.route },
        )
    }

    @Test
    fun `top level routes are unique`() {
        val routes = TopLevelDestination.entries.map { it.route }
        assertEquals(routes.size, routes.toSet().size)
    }

    @Test
    fun `module route is built from id`() {
        assertEquals("module/42", ModuleDetailDestination.createRoute(42L))
    }
}
