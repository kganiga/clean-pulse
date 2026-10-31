package com.cleanpulse.app

import android.Manifest
import android.content.ActivityNotFoundException
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.DocumentsContract
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.FactCheck
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.automirrored.outlined.FactCheck
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.MonitorHeart
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.ScanPhase
import com.cleanpulse.app.data.storage.StorageAccess
import com.cleanpulse.app.ui.StorageViewModel
import com.cleanpulse.app.ui.screens.AccessScreen
import com.cleanpulse.app.ui.screens.AutoCleanSettingsScreen
import com.cleanpulse.app.ui.screens.CleanupImpactInfoScreen
import com.cleanpulse.app.ui.screens.CleanupResultsScreen
import com.cleanpulse.app.ui.screens.DashboardScreen
import com.cleanpulse.app.ui.screens.DeviceHealthScreen
import com.cleanpulse.app.ui.screens.FileReviewScreen
import com.cleanpulse.app.ui.screens.HistoryScreen
import com.cleanpulse.app.ui.screens.OnboardingScreen
import com.cleanpulse.app.ui.screens.PrivacySettingsScreen
import com.cleanpulse.app.ui.screens.ScanProgressScreen
import com.cleanpulse.app.ui.screens.ScanResultsScreen
import com.cleanpulse.app.ui.theme.CleanPulseTheme
import com.cleanpulse.app.ui.theme.Emerald
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            CleanPulseTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    CleanPulseApp()
                }
            }
        }
    }
}

private object Routes {
    const val HOME = "home"
    const val REVIEW_TAB = "review"
    const val GUIDE = "guide"
    const val HEALTH = "health"
    const val SETTINGS = "settings"

    const val SCAN = "scan"
    const val RESULTS = "results"
    const val REVIEW_CATEGORY = "review/{category}"
    const val CLEANUP_DONE = "cleanup_done"
    const val HISTORY = "history"
    const val PRIVACY = "privacy"

    fun review(category: FileCategory) = "review/${category.name}"
}

private data class Tab(val route: String, val label: String, val icon: ImageVector, val selectedIcon: ImageVector)

private val TABS = listOf(
    Tab(Routes.HOME, "Home", Icons.Outlined.Home, Icons.Filled.Home),
    Tab(Routes.REVIEW_TAB, "Review", Icons.AutoMirrored.Outlined.FactCheck, Icons.AutoMirrored.Filled.FactCheck),
    Tab(Routes.GUIDE, "Guide", Icons.Outlined.Info, Icons.Filled.Info),
    Tab(Routes.HEALTH, "Health", Icons.Outlined.MonitorHeart, Icons.Filled.MonitorHeart),
    Tab(Routes.SETTINGS, "Settings", Icons.Outlined.Settings, Icons.Filled.Settings)
)

/** Which tab a route belongs to, for highlighting the bottom bar. */
private fun tabFor(route: String?): String? = when (route) {
    Routes.HOME, Routes.RESULTS -> Routes.HOME
    Routes.REVIEW_TAB, Routes.REVIEW_CATEGORY -> Routes.REVIEW_TAB
    Routes.GUIDE -> Routes.GUIDE
    Routes.HEALTH -> Routes.HEALTH
    Routes.SETTINGS, Routes.HISTORY, Routes.PRIVACY -> Routes.SETTINGS
    else -> null
}

/** Converts a folder picked with the system picker into a file path on shared storage. */
private fun treeUriToFolder(uri: Uri): File? {
    val docId = DocumentsContract.getTreeDocumentId(uri)
    val volume = docId.substringBefore(':')
    val relative = docId.substringAfter(':', "")
    val base = if (volume.equals("primary", ignoreCase = true)) Environment.getExternalStorageDirectory() else File("/storage/$volume")
    return File(base, relative).takeIf { it.isDirectory }
}

@Composable
fun CleanPulseApp(viewModel: StorageViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val settings by viewModel.settings.collectAsStateWithLifecycle()
    val onboardingDone by viewModel.onboardingDone.collectAsStateWithLifecycle()
    val history by viewModel.cleanupHistory.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val navController = rememberNavController()

    LifecycleResumeEffect(Unit) {
        viewModel.refreshDevice()
        onPauseOrDispose {}
    }

    val legacyPermissions = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        viewModel.refreshDevice()
    }
    val notificationPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    val folderPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        val folder = uri?.let { treeUriToFolder(it) } ?: return@rememberLauncherForActivityResult
        viewModel.startScan(folder)
        navController.navigate(Routes.SCAN)
    }

    when (onboardingDone) {
        null -> return
        false -> {
            OnboardingScreen(onContinue = viewModel::completeOnboarding)
            return
        }
        true -> Unit
    }

    if (!state.hasAccess) {
        AccessScreen(onGrant = {
            val intent = StorageAccess.allFilesAccessIntent(context)
            if (intent == null) {
                legacyPermissions.launch(StorageAccess.legacyPermissions)
            } else {
                try {
                    context.startActivity(intent)
                } catch (_: ActivityNotFoundException) {
                    StorageAccess.fallbackAllFilesAccessIntent()?.let { context.startActivity(it) }
                }
            }
        })
        return
    }

    // Leave the progress screen once a scan finishes or is cancelled.
    LaunchedEffect(state.scan.phase) {
        if (navController.currentDestination?.route != Routes.SCAN) return@LaunchedEffect
        when (state.scan.phase) {
            ScanPhase.COMPLETED -> navController.navigate(Routes.RESULTS) { popUpTo(Routes.HOME) }
            ScanPhase.CANCELLED -> navController.popBackStack()
            else -> Unit
        }
    }

    // Show the completion screen after every cleanup.
    LaunchedEffect(state.lastCleanup?.timestamp) {
        if (state.lastCleanup != null && navController.currentDestination?.route != Routes.CLEANUP_DONE) {
            navController.navigate(Routes.CLEANUP_DONE) { launchSingleTop = true }
        }
    }

    fun startScan(nav: NavHostController) {
        viewModel.startScan()
        nav.navigate(Routes.SCAN)
    }

    // Tabs always open at their root. Restoring saved tab stacks brought back stale
    // sub-screens (e.g. an empty Cleanup Complete page after tapping "Back to dashboard").
    fun selectTab(route: String) {
        if (route == Routes.HOME) {
            navController.popBackStack(Routes.HOME, inclusive = false)
            return
        }
        navController.navigate(route) {
            popUpTo(Routes.HOME)
            launchSingleTop = true
        }
    }

    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBottomBar = currentRoute != Routes.SCAN && currentRoute != Routes.CLEANUP_DONE

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceContainer) {
                    val activeTab = tabFor(currentRoute)
                    TABS.forEach { tab ->
                        val selected = activeTab == tab.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = { selectTab(tab.route) },
                            icon = { Icon(if (selected) tab.selectedIcon else tab.icon, contentDescription = null) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Emerald,
                                selectedTextColor = Emerald,
                                indicatorColor = Emerald.copy(alpha = 0.15f)
                            )
                        )
                    }
                }
            }
        }
    ) { outer ->
        Box(Modifier.padding(outer).consumeWindowInsets(outer)) {
            NavHost(navController = navController, startDestination = Routes.HOME) {
                composable(Routes.HOME) {
                    DashboardScreen(
                        state = state,
                        settings = settings,
                        history = history,
                        tips = viewModel.tips,
                        tipIndex = viewModel.todayTipIndex,
                        onScan = { startScan(navController) },
                        onScanFolder = { folderPicker.launch(null) },
                        onQuickClean = viewModel::quickClean,
                        onCleanSelected = { navController.navigate(Routes.RESULTS) },
                        onOpenCategory = { category ->
                            if (category == null) selectTab(Routes.REVIEW_TAB) else navController.navigate(Routes.review(category))
                        },
                        onOpenSettings = { selectTab(Routes.SETTINGS) },
                        onOpenHistory = { navController.navigate(Routes.HISTORY) },
                        onOpenGuide = { selectTab(Routes.GUIDE) },
                        onArchive = viewModel::archiveCandidates,
                        onDeleteSuggested = viewModel::deleteCandidates,
                        onDismissArchive = viewModel::dismissArchiveResult
                    )
                }
                composable(Routes.SCAN) {
                    ScanProgressScreen(progress = state.scan, onCancel = viewModel::cancelScan)
                }
                composable(Routes.RESULTS) {
                    ScanResultsScreen(
                        state = state,
                        onBack = { navController.popBackStack() },
                        onOpenCategory = { navController.navigate(Routes.review(it)) },
                        onSetCategorySelected = viewModel::setCategorySelected,
                        onClean = viewModel::cleanSelected
                    )
                }
                composable(Routes.REVIEW_TAB) {
                    FileReviewScreen(
                        state = state,
                        initialCategory = null,
                        showBack = false,
                        onBack = {},
                        onToggle = viewModel::toggle,
                        onSetAll = viewModel::setCategorySelected,
                        onClean = viewModel::cleanSelected,
                        onScan = { startScan(navController) }
                    )
                }
                composable(Routes.REVIEW_CATEGORY) { entry ->
                    val category = FileCategory.valueOf(entry.arguments?.getString("category") ?: FileCategory.DUPLICATES.name)
                    FileReviewScreen(
                        state = state,
                        initialCategory = category,
                        showBack = true,
                        onBack = { navController.popBackStack() },
                        onToggle = viewModel::toggle,
                        onSetAll = viewModel::setCategorySelected,
                        onClean = viewModel::cleanSelected,
                        onScan = { startScan(navController) }
                    )
                }
                composable(Routes.CLEANUP_DONE) {
                    val cleanup = state.lastCleanup
                    if (cleanup != null) {
                        CleanupResultsScreen(
                            cleanup = cleanup,
                            onDone = {
                                navController.popBackStack(Routes.HOME, inclusive = false)
                                viewModel.dismissCleanupResult()
                            },
                            onViewHistory = {
                                navController.navigate(Routes.HISTORY) { popUpTo(Routes.HOME) }
                                viewModel.dismissCleanupResult()
                            }
                        )
                    } else {
                        // Nothing to show (e.g. after the app was restored); go home instead of a blank page.
                        LaunchedEffect(Unit) { navController.popBackStack(Routes.HOME, inclusive = false) }
                    }
                }
                composable(Routes.GUIDE) {
                    CleanupImpactInfoScreen(
                        candidates = state.candidates,
                        onBack = null,
                        onNavigateToReviewCategory = { navController.navigate(Routes.review(it)) }
                    )
                }
                composable(Routes.HEALTH) {
                    DeviceHealthScreen(state = state, onLoad = viewModel::loadHealth)
                }
                composable(Routes.SETTINGS) {
                    AutoCleanSettingsScreen(
                        settings = settings,
                        onUpdate = { transform ->
                            val turningOn = !settings.enabled && transform(settings).enabled
                            if (turningOn && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                            }
                            viewModel.updateSettings(transform)
                        },
                        onOpenHistory = { navController.navigate(Routes.HISTORY) },
                        onOpenPrivacy = { navController.navigate(Routes.PRIVACY) }
                    )
                }
                composable(Routes.HISTORY) {
                    val scans by viewModel.scanHistory.collectAsStateWithLifecycle()
                    HistoryScreen(history, scans, onBack = { navController.popBackStack() }, onClear = viewModel::clearHistory)
                }
                composable(Routes.PRIVACY) {
                    PrivacySettingsScreen(
                        state = state,
                        onBack = { navController.popBackStack() },
                        onClearAppCache = viewModel::clearAppCache,
                        onReplayOnboarding = viewModel::replayOnboarding
                    )
                }
            }
        }
    }
}
