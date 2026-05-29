import { HeroSection }        from '../components/sections/HeroSection'
import { CategorySection }    from '../components/sections/CategorySection'
import { ExperienceSection }  from '../components/sections/ExperienceSection'
import { BenefitsSection }    from '../components/sections/BenefitsSection'
import { TrendingProducts }   from '../components/sections/TrendingProducts'
import { TestimonialsSection }from '../components/sections/TestimonialsSection'
import { PromoBanners }       from '../components/sections/PromoBanners'
import { SpecialProducts }    from '../components/sections/SpecialProducts'
import { BlogSection }        from '../components/sections/BlogSection'
export function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <CategorySection />
      <ExperienceSection />
      <BenefitsSection />
      <TrendingProducts />
      <TestimonialsSection />
      <PromoBanners />
      <SpecialProducts />
      <BlogSection />
    </div>
  )
}
