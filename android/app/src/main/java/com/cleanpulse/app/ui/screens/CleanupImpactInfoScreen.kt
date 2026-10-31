package com.cleanpulse.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cleanpulse.app.data.model.FileCategory
import com.cleanpulse.app.data.model.StorageCandidate
import com.cleanpulse.app.ui.components.BackTopBar

data class CategoryImpactInfo(
    val category: FileCategory,
    val title: String,
    val isSafe: Boolean,
    val whyFlagged: String,
    val systemImpact: String,
    val recreationBehavior: String
)

@Composable
fun CleanupImpactInfoScreen(
    candidates: List<StorageCandidate>,
    onBack: (() -> Unit)?,
    onNavigateToReviewCategory: (FileCategory) -> Unit
) {
    var expandedCategory by remember { mutableStateOf<FileCategory?>(null) }

    val guides = remember {
        listOf(
            CategoryImpactInfo(
                FileCategory.APP_CACHE,
                "App cache",
                true,
                "Temporary data CleanPulse itself created.",
                "Zero negative impact. Reclaims disk blocks immediately. App recreates cache on demand.",
                "Recreated automatically upon next application launch."
            ),
            CategoryImpactInfo(
                FileCategory.DUPLICATES,
                "Duplicate Files (SHA-256)",
                true,
                "Exact byte-for-byte SHA-256 hash match with an earlier file.",
                "Original earliest master copy is preserved. Only redundant copies are removed.",
                "Master file remains safely stored in original location."
            ),
            CategoryImpactInfo(
                FileCategory.TEMP_FILES,
                "Temporary & Residual Files",
                true,
                "Partial downloads, .tmp files and items left in gallery trash folders.",
                "Zero impact on running apps. Obsolete diagnostic traces.",
                "Will not be recreated unless another crash occurs."
            ),
            CategoryImpactInfo(
                FileCategory.APP_APKS,
                "Old APK Installers",
                true,
                "Standalone .apk installer files anywhere on shared storage.",
                "Package installer is redundant once app is installed. Deleting installer does not uninstall app.",
                "Reinstalling requires re-downloading fresh package."
            ),
            CategoryImpactInfo(
                FileCategory.EMPTY_DIRS,
                "Empty folders",
                true,
                "Folders below the top level of storage that contain nothing.",
                "No data is lost. Top-level folders like DCIM or Download are never removed.",
                "Apps recreate folders they need."
            ),
            CategoryImpactInfo(
                FileCategory.OLD_DOWNLOADS,
                "Old downloads",
                false,
                "Files in Download older than your chosen age (60 days by default).",
                "May contain personal tickets or documents. Permanent deletion.",
                "Cannot be recovered unless re-downloaded from web source."
            ),
            CategoryImpactInfo(
                FileCategory.LARGE_FILES,
                "Large files",
                false,
                "High capacity 4K videos, screen records, and offline maps.",
                "Personal user media. Highest storage footprint, but NOT system junk.",
                "Irreplaceable without cloud backups."
            )
        )
    }

    Scaffold(
        topBar = { BackTopBar("What gets cleaned", "Which files are ready to clean and why", onBack) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Readiness Overview", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "CleanPulse pre-selects only cache, temporary files, installers, empty folders and extra duplicate copies. Downloads and large files stay unselected until you choose them.",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }

            items(guides) { guide ->
                val matchingFiles = candidates.filter { it.category == guide.category }
                val isExpanded = expandedCategory == guide.category

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .clickable {
                            expandedCategory = if (isExpanded) null else guide.category
                        },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(guide.title, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                Text(
                                    "${matchingFiles.size} candidates found",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )
                            }
                            Text(
                                if (guide.isSafe) "Safe to Clean" else "Review Needed",
                                fontSize = 11.sp,
                                color = if (guide.isSafe) Color(0xFF10B981) else Color(0xFFF59E0B),
                                fontWeight = FontWeight.Medium
                            )
                        }

                        AnimatedVisibility(visible = isExpanded) {
                            Column(
                                modifier = Modifier
                                    .padding(top = 12.dp)
                                    .fillMaxWidth()
                            ) {
                                Text("Why Flagged:", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                Text(guide.whyFlagged, fontSize = 11.sp, color = Color.LightGray)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("System Impact:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFF10B981))
                                Text(guide.systemImpact, fontSize = 11.sp, color = Color.LightGray)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Recreation:", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                Text(guide.recreationBehavior, fontSize = 11.sp, color = Color.LightGray)
                                if (matchingFiles.isNotEmpty()) {
                                    TextButton(onClick = { onNavigateToReviewCategory(guide.category) }) {
                                        Text("Review ${matchingFiles.size} files")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
