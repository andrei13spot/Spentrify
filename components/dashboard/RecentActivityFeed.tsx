// components/dashboard/RecentActivityFeed.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME, getCategoryColor, getCategoryIcon, getCategoryTint } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface FeedTransaction {
  id: string | number;
  amount: number;
  merchant_name?: string;
  description?: string;
  category?: string;
  category_id?: number;
  transaction_date?: string;
  source_type?: string;
  is_reimbursable?: boolean | number;
}

interface RecentActivityFeedProps {
  transactions: FeedTransaction[];
  onPressTransaction?: (tx: FeedTransaction) => void;
  onPressSeeAll?: () => void;
  limit?: number;
}

export function RecentActivityFeed({
  transactions,
  onPressTransaction,
  onPressSeeAll,
  limit = 6,
}: RecentActivityFeedProps) {
  const displayed = transactions.slice(0, limit);

  return (
    <View style={styles.card}>
      {/* Feed Header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="time" size={16} color={THEME.primary} />
          </View>
          <Text style={styles.title}>Recent Activity</Text>
        </View>

        {transactions.length > limit && onPressSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onPressSeeAll}>
            <Text style={styles.seeAllText}>View All ({transactions.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transaction List */}
      {displayed.length > 0 ? (
        <View style={styles.list}>
          {displayed.map((tx, index) => {
            const categoryName = tx.category || 'Others';
            const catColor = getCategoryColor(categoryName);
            const catTint = getCategoryTint(categoryName);
            const catIcon = getCategoryIcon(categoryName);
            const isReimbursable = tx.is_reimbursable === 1 || tx.is_reimbursable === true;
            const merchantTitle = tx.merchant_name || tx.description || 'Expense';
            const isLast = index === displayed.length - 1;

            return (
              <TouchableOpacity
                key={tx.id?.toString() || index.toString()}
                activeOpacity={0.75}
                style={[styles.itemRow, !isLast && styles.itemBorder]}
                onPress={() => onPressTransaction?.(tx)}
              >
                {/* Category Icon Badge */}
                <View style={[styles.categoryBadge, { backgroundColor: catTint }]}>
                  <Ionicons name={catIcon as any} size={20} color={catColor} />
                </View>

                {/* Info Center */}
                <View style={styles.infoCol}>
                  <View style={styles.merchantRow}>
                    <Text style={styles.merchantName} numberOfLines={1}>
                      {merchantTitle}
                    </Text>
                    {isReimbursable && (
                      <View style={styles.reimbursableBadge}>
                        <Ionicons name="briefcase-outline" size={10} color="#0284C7" />
                        <Text style={styles.reimbursableText}>Claimable</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{categoryName}</Text>
                    {tx.transaction_date && (
                      <>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{tx.transaction_date}</Text>
                      </>
                    )}
                    {tx.source_type && tx.source_type !== 'Digital' && (
                      <>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{tx.source_type}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Amount Right */}
                <View style={styles.amountCol}>
                  <Text style={styles.amountText}>
                    -₱{tx.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="receipt-outline" size={26} color={THEME.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubText}>
            Expenses logged manually or caught via SMS will appear here in real time.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: THEME.primary,
  },
  list: {
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  merchantName: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
    maxWidth: '75%',
  },
  reimbursableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    gap: 3,
  },
  reimbursableText: {
    fontSize: 9,
    fontFamily: fonts.heading,
    color: '#0284C7',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
  },
  metaDot: {
    fontSize: 11,
    color: THEME.muted,
    marginHorizontal: 4,
  },
  amountCol: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});

