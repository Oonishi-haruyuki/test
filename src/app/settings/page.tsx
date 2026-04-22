'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings2, RefreshCw } from 'lucide-react';

type BattleSpeed = 'slow' | 'normal' | 'fast';
type CardQuality = 'standard' | 'high';

type AppSettings = {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  reduceMotion: boolean;
  showCardHints: boolean;
  confirmBeforePurchase: boolean;
  battleSpeed: BattleSpeed;
  cardQuality: CardQuality;
};

const SETTINGS_STORAGE_KEY = 'local-app-settings-v1';

const defaultSettings: AppSettings = {
  soundEnabled: true,
  bgmEnabled: true,
  reduceMotion: false,
  showCardHints: true,
  confirmBeforePurchase: true,
  battleSpeed: 'normal',
  cardQuality: 'standard',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load app settings', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save app settings', error);
      toast({
        variant: 'destructive',
        title: '設定の保存に失敗しました',
        description: 'ブラウザの保存領域を確認してください。',
      });
    }
  }, [settings, isHydrated, toast]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove app settings', error);
    }
    toast({
      title: '設定を初期化しました',
      description: 'デフォルト設定に戻しました。',
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
          <Settings2 className="h-8 w-8" />
          設定
        </h1>
        <p className="text-muted-foreground mt-2">
          開発中のため、設定は現在このブラウザにローカル保存されます。
        </p>
      </div>

      <Alert>
        <AlertTitle>ログイン不安定時でも反映されます</AlertTitle>
        <AlertDescription>
          このページの設定値はサーバー同期ではなくローカル保存です。ログイン状態に関係なく利用できます。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>サウンド</CardTitle>
          <CardDescription>音量や再生可否の基本設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="setting-sound">効果音を有効化</Label>
              <p className="text-sm text-muted-foreground">カード生成・対戦時の効果音を再生します。</p>
            </div>
            <Switch
              id="setting-sound"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="setting-bgm">BGMを有効化</Label>
              <p className="text-sm text-muted-foreground">画面に応じてBGMを再生します。</p>
            </div>
            <Switch
              id="setting-bgm"
              checked={settings.bgmEnabled}
              onCheckedChange={(checked) => updateSetting('bgmEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>表示・操作</CardTitle>
          <CardDescription>演出やUIの見え方を調整</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>対戦スピード</Label>
              <Select
                value={settings.battleSpeed}
                onValueChange={(value: BattleSpeed) => updateSetting('battleSpeed', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="対戦スピード" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">ゆっくり</SelectItem>
                  <SelectItem value="normal">標準</SelectItem>
                  <SelectItem value="fast">高速</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>カード画像品質</Label>
              <Select
                value={settings.cardQuality}
                onValueChange={(value: CardQuality) => updateSetting('cardQuality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="カード画像品質" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">標準</SelectItem>
                  <SelectItem value="high">高画質</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="setting-reduce-motion">アニメーションを減らす</Label>
              <p className="text-sm text-muted-foreground">端末性能が低い場合の動作安定化に有効です。</p>
            </div>
            <Switch
              id="setting-reduce-motion"
              checked={settings.reduceMotion}
              onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="setting-hints">カード作成ヒントを表示</Label>
              <p className="text-sm text-muted-foreground">入力補助やヒント文を表示します。</p>
            </div>
            <Switch
              id="setting-hints"
              checked={settings.showCardHints}
              onCheckedChange={(checked) => updateSetting('showCardHints', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>購入・データ</CardTitle>
          <CardDescription>確認ダイアログと設定初期化</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="setting-confirm-purchase">購入前に確認する</Label>
              <p className="text-sm text-muted-foreground">ショップ購入時に確認ダイアログを表示します。</p>
            </div>
            <Switch
              id="setting-confirm-purchase"
              checked={settings.confirmBeforePurchase}
              onCheckedChange={(checked) => updateSetting('confirmBeforePurchase', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">設定を初期化</p>
              <p className="text-sm text-muted-foreground">この端末に保存された設定値をデフォルトへ戻します。</p>
            </div>
            <Button variant="outline" onClick={resetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              初期化
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
